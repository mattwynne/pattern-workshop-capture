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

  private async findByCaptureId(captureId: string): Promise<PublishedPattern | null> {
    const query = encodeURIComponent(`repo:${this.options.owner}/${this.options.repo} path:content/patterns ${captureId}`);
    const response = await this.request(`/search/code?q=${query}`);
    if (!response.ok) return null;
    const data = await response.json() as { items?: Array<{ path: string; html_url: string }> };
    const item = data.items?.[0];
    if (!item) return null;
    const slug = item.path.split("/")[2];
    return this.result(slug, item.html_url);
  }

  private result(slug: string, commitUrl: string): PublishedPattern {
    return {
      slug,
      commitUrl,
      publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, "")}/patterns/${slug}/`,
    };
  }

  private async pathExists(path: string): Promise<boolean> {
    const response = await this.request(`/repos/${this.options.owner}/${this.options.repo}/contents/${path}?ref=${this.branch}`);
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
    const existing = await this.findByCaptureId(pattern.captureId);
    if (existing) return existing;

    const root = slugify(pattern.name);
    for (let suffix = 1; suffix <= 100; suffix++) {
      const slug = suffix === 1 ? root : `${root}-${suffix}`;
      const bundlePath = `content/patterns/${slug}`;
      if (await this.pathExists(`${bundlePath}/index.md`)) continue;

      const ref = await this.json<RefResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/ref/heads/${this.branch}`);
      const parent = await this.json<CommitResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/commits/${ref.object.sha}`);
      const markdownSha = await this.createBlob(Buffer.from(patternMarkdown(pattern), "utf8"));
      const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [
        { path: `${bundlePath}/index.md`, mode: "100644", type: "blob", sha: markdownSha },
      ];
      if (avatar) {
        const avatarSha = await this.createBlob(avatar.bytes);
        treeEntries.push({ path: `${bundlePath}/avatar.${avatar.extension}`, mode: "100644", type: "blob", sha: avatarSha });
      }
      const tree = await this.json<ShaResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/trees`, {
        method: "POST", body: JSON.stringify({ base_tree: parent.tree.sha, tree: treeEntries }),
      });
      const commit = await this.json<ShaResponse>(`/repos/${this.options.owner}/${this.options.repo}/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message: `Publish pattern: ${pattern.name}\n\nCapture-ID: ${pattern.captureId}`, tree: tree.sha, parents: [ref.object.sha] }),
      });
      const update = await this.request(`/repos/${this.options.owner}/${this.options.repo}/git/refs/heads/${this.branch}`, {
        method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      if (update.ok) return this.result(slug, `https://github.com/${this.options.owner}/${this.options.repo}/commit/${commit.sha}`);
      if (update.status === 409 || update.status === 422) {
        const duplicate = await this.findByCaptureId(pattern.captureId);
        if (duplicate) return duplicate;
        continue;
      }
      throw new Error(`GitHub publication failed (${update.status})`);
    }
    throw new Error("Could not reserve a unique pattern name");
  }
}
