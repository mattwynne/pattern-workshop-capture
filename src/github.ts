import { createHash } from "node:crypto";
import { PatternInput, patternMarkdown, slugify } from "./pattern.js";
import type { PublicAvatar } from "./image.js";

export interface PublishedPattern {
  slug: string;
  commitUrl: string;
  publicUrl: string;
}

export interface PatternPublisher {
  publish(pattern: PatternInput, avatar?: PublicAvatar): Promise<PublishedPattern>;
}

interface GitHubPublisherOptions {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  publicBaseUrl: string;
}

interface RefResponse { object: { sha: string } }
interface CommitResponse { tree: { sha: string } }
interface ShaResponse { sha: string }

export class GitHubPublisher implements PatternPublisher {
  private branch: string;

  constructor(private options: GitHubPublisherOptions) {
    this.branch = options.branch ?? "main";
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`https://api.github.com${path}`, {
      ...init,
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.options.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  }

  private async json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.request(path, init);
    if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
    return response.json() as Promise<T>;
  }

  private result(slug: string, commitUrl: string): PublishedPattern {
    return {
      slug,
      commitUrl,
      publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, "")}/patterns/${slug}/`,
    };
  }

  private async pathExists(path: string, ref: string): Promise<boolean> {
    const response = await this.request(`/repos/${this.options.owner}/${this.options.repo}/contents/${path}?ref=${encodeURIComponent(ref)}`);
    if (response.status === 404) return false;
    if (!response.ok) throw new Error(`GitHub path check failed (${response.status})`);
    return true;
  }

  private async createBlob(bytes: Buffer): Promise<string> {
    const blob = await this.json<ShaResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: bytes.toString("base64"), encoding: "base64" }),
    });
    return blob.sha;
  }

  async publish(pattern: PatternInput, avatar?: PublicAvatar): Promise<PublishedPattern> {
    const repo = `/repos/${this.options.owner}/${this.options.repo}`;
    const receiptPath = `.workshop-captures/${createHash('sha256').update(pattern.captureId).digest('hex')}.json`;
    const root = slugify(pattern.name);
    const deadline = Date.now() + 240_000;
    for (let attempt = 0; attempt < 150 && Date.now() < deadline; attempt++) {
      const ref = await this.json<RefResponse>(`${repo}/git/ref/heads/${this.branch}`);
      // Both receipt and slug checks use the same immutable tree as the commit parent.
      const receipt = await this.request(`${repo}/contents/${receiptPath}?ref=${ref.object.sha}`);
      if (receipt.ok) {
        const data = await receipt.json() as { content: string };
        const { slug } = JSON.parse(Buffer.from(data.content, 'base64').toString());
        return this.result(slug, `https://github.com/${this.options.owner}/${this.options.repo}/commit/${ref.object.sha}`);
      }
      if (receipt.status !== 404) throw new Error(`GitHub receipt check failed (${receipt.status})`);
      let slug = root;
      let suffix = 1;
      while (await this.pathExists(`content/patterns/${slug}/index.md`, ref.object.sha)) {
        slug = `${root}-${++suffix}`;
        if (suffix > 1000) throw new Error("Could not reserve a unique pattern name");
      }
      const bundlePath = `content/patterns/${slug}`;
      const parent = await this.json<CommitResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/commits/${ref.object.sha}`);
      const markdownSha = await this.createBlob(Buffer.from(patternMarkdown(pattern), "utf8"));
      const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [
        { path: `${bundlePath}/index.md`, mode: "100644", type: "blob", sha: markdownSha },
      ];
      if (avatar) {
        const avatarSha = await this.createBlob(avatar.bytes);
        treeEntries.push({ path: `${bundlePath}/avatar.${avatar.extension}`, mode: "100644", type: "blob", sha: avatarSha });
      }
      const receiptSha = await this.createBlob(Buffer.from(JSON.stringify({ slug })));
      treeEntries.push({ path: receiptPath, mode: "100644", type: "blob", sha: receiptSha });
      const tree = await this.json<ShaResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/trees`, {
        method: "POST", body: JSON.stringify({ base_tree: parent.tree.sha, tree: treeEntries }),
      });
      const commit = await this.json<ShaResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message: `Publish pattern: ${pattern.name}\n\nCapture-ID: ${pattern.captureId}`, tree: tree.sha, parents: [ref.object.sha] }),
      });
      try {
        const update = await this.request(`${repo}/git/refs/heads/${this.branch}`, {
          method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }),
        });
        if (update.ok) return this.result(slug, `https://github.com/${this.options.owner}/${this.options.repo}/commit/${commit.sha}`);
        if (![409, 422, 500, 502, 503, 504].includes(update.status)) {
          throw new Error(`GitHub publication failed (${update.status})`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('GitHub publication failed')) throw error;
        // A lost PATCH response is ambiguous: the next snapshot checks the atomic receipt.
      }

    }
    throw new Error("Could not reserve a unique pattern name");
  }
}
