import { randomUUID } from "node:crypto";
import type { Response } from "express";

export type DraftStage = "drafting" | "publishing" | "published" | "failed";
export interface DraftStatus { id: string; name: string; stage: DraftStage; publicUrl?: string; updatedAt: string }

export class DraftBoard {
  private drafts = new Map<string, DraftStatus>();
  private listeners = new Set<Response>();

  create(): DraftStatus {
    const draft = { id: randomUUID(), name: "Untitled pattern", stage: "drafting" as const, updatedAt: new Date().toISOString() };
    this.drafts.set(draft.id, draft);
    this.broadcast();
    return draft;
  }

  update(id: string, update: Partial<Pick<DraftStatus, "name" | "stage" | "publicUrl">>): DraftStatus | null {
    const current = this.drafts.get(id);
    if (!current) return null;
    const next = { ...current, ...update, updatedAt: new Date().toISOString() };
    this.drafts.set(id, next);
    this.broadcast();
    return next;
  }

  all(): DraftStatus[] { return [...this.drafts.values()]; }

  subscribe(response: Response): () => void {
    this.listeners.add(response);
    this.send(response);
    return () => this.listeners.delete(response);
  }

  private send(response: Response): void {
    response.write(`data: ${JSON.stringify(this.all())}\n\n`);
  }

  private broadcast(): void {
    for (const listener of this.listeners) this.send(listener);
  }
}
