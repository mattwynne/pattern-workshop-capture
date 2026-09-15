import { randomUUID } from "node:crypto";
import type { Response } from "express";

export type DraftStage = "drafting" | "publishing" | "awaiting-pages" | "publication-delayed" | "published" | "failed";
export interface DraftStatus { id: string; name: string; stage: DraftStage; publicUrl?: string; updatedAt: string }
export type PageProbe = (url: string) => Promise<boolean>;
// Only publisher-produced URLs are probed. Never follow redirects or forward credentials.
export const probePage: PageProbe = async url => {
  const response = await fetch(url, { method: "HEAD", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(5000) });
  return response.status === 200;
};
const safeUrl = (value: string) => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && value.length <= 2048; } catch { return false; } };

export class DraftBoard {
  private drafts = new Map<string, DraftStatus>();
  private listeners = new Map<Response, () => void>();
  private pending = new Map<string, { url: string; attempts: number }>();
  private timer?: NodeJS.Timeout;
  private checking = false;
  constructor(private probe?: PageProbe, private capacity = 200, private subscriberCapacity = 60) {}

  create(id?: string): DraftStatus | null {
    if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
    if (id && this.drafts.has(id)) return { ...this.drafts.get(id)! };
    if (this.drafts.size >= this.capacity) return null;
    const draft = { id: id || randomUUID(), name: "Untitled pattern", stage: "drafting" as const, updatedAt: new Date().toISOString() };
    this.drafts.set(draft.id, draft); this.broadcast(); return { ...draft };
  }

  update(id: string, update: Partial<Pick<DraftStatus, "name" | "stage" | "publicUrl">>): DraftStatus | null {
    const current = this.drafts.get(id);
    if (!current) return null;
    if (current.stage === "published") return { ...current };
    const committed = ['awaiting-pages', 'publication-delayed'].includes(current.stage);
    if (committed && !['published', 'publication-delayed', 'awaiting-pages'].includes(update.stage || '')) return { ...current };
    if (current.stage === 'publishing' && !update.stage) return { ...current };
    const next: DraftStatus = { ...current, updatedAt: new Date().toISOString() };
    if (update.name !== undefined && !committed) next.name = update.name.trim().slice(0, 120) || 'Untitled pattern';
    if (update.stage) next.stage = update.stage;
    if (next.stage === 'published') {
      const url = update.publicUrl || this.pending.get(id)?.url;
      if (!url || !safeUrl(url)) return { ...current };
      next.publicUrl = url; this.pending.delete(id);
    }
    this.drafts.set(id, next); this.broadcast(); return { ...next };
  }

  committed(id: string, url: string): void {
    if (!safeUrl(url) || !this.drafts.has(id) || this.drafts.get(id)!.stage === 'published') return;
    this.pending.set(id, { url, attempts: 0 });
    this.update(id, { stage: 'awaiting-pages' });
    if (this.probe && !this.timer) {
      this.timer = setInterval(() => { void this.checkPages(); }, 5000); this.timer.unref();
    }
  }

  retryPages(id: string): boolean {
    const pending = this.pending.get(id);
    if (!pending) return false;
    this.committed(id, pending.url); return true;
  }

  async checkPages(): Promise<void> {
    if (!this.probe || this.checking) return;
    this.checking = true;
    try {
      // Five bounded requests per tick; rotate for fairness across a full workshop.
      const entries = [...this.pending].filter(([, pending]) => pending.attempts < 12).slice(0, 5);
      await Promise.all(entries.map(async ([id, pending]) => {
        this.pending.delete(id); this.pending.set(id, pending);
        let live = false;
        try { live = await this.probe!(pending.url); } catch { /* No provider diagnostics in room state. */ }
        if (this.pending.get(id) !== pending) return; // A newer retry owns this check.
        if (live) this.update(id, { stage: 'published', publicUrl: pending.url });
        else if (++pending.attempts >= 12) { this.update(id, { stage: 'publication-delayed' }); }
      }));
    } finally {
      this.checking = false;
      if (![...this.pending.values()].some(pending => pending.attempts < 12) && this.timer) { clearInterval(this.timer); this.timer = undefined; }
    }
  }

  all(): DraftStatus[] { return [...this.drafts.values()].map(draft => ({ ...draft })); }
  dispose(): void { if (this.timer) clearInterval(this.timer); this.timer = undefined; for (const response of this.listeners.keys()) { this.listeners.get(response)!(); response.destroy(); } }

  subscribe(response: Response): () => void {
    if (this.listeners.size >= this.subscriberCapacity) { response.end(); return () => {}; }
    let heartbeat: NodeJS.Timeout | undefined;
    const cleanup = () => { if (heartbeat) clearInterval(heartbeat); this.listeners.delete(response); response.off?.('close', cleanup); response.off?.('error', cleanup); };
    this.listeners.set(response, cleanup);
    response.on?.('close', cleanup); response.on?.('error', cleanup);
    if (this.send(response)) { heartbeat = setInterval(() => { this.send(response, ': heartbeat\n\n'); }, 15000); heartbeat.unref(); }
    return cleanup;
  }

  private send(response: Response, frame = `data: ${JSON.stringify(this.all())}\n\n`): boolean {
    try {
      if (response.destroyed || response.writableEnded || response.writableLength + Buffer.byteLength(frame) > 1_048_576) {
        this.listeners.get(response)?.(); response.destroy(); return false;
      }
      response.write(frame);
      return true;
    } catch { this.listeners.get(response)?.(); response.destroy(); return false; }
  }
  private broadcast(): void { const frame = `data: ${JSON.stringify(this.all())}\n\n`; for (const listener of this.listeners.keys()) this.send(listener, frame); }
}
