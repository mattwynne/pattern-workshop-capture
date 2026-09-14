import { PatternInput, patternMarkdown, slugify } from "./pattern.js";

export interface PublishedPattern {
  slug: string;
  commitUrl: string;
  publicUrl: string;
}

export interface PatternPublisher {
  publish(pattern: PatternInput): Promise<PublishedPattern>;
}

interface GitHubPublisherOptions {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  publicBaseUrl: string;
}

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

  private async findByCaptureId(captureId: string): Promise<PublishedPattern | null> {
    const query = encodeURIComponent(`repo:${this.options.owner}/${this.options.repo} path:content/patterns ${captureId}`);
    const response = await this.request(`/search/code?q=${query}`);
    if (!response.ok) return null;
    const data = await response.json() as { items?: Array<{ path: string; html_url: string }> };
    const item = data.items?.[0];
    if (!item) return null;
    const slug = item.path.split("/")[2];
    return {
      slug,
      commitUrl: item.html_url,
      publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, "")}/patterns/${slug}/`,
    };
  }

  async publish(pattern: PatternInput): Promise<PublishedPattern> {
    const existing = await this.findByCaptureId(pattern.captureId);
    if (existing) return existing;

    const root = slugify(pattern.name);
    const content = Buffer.from(patternMarkdown(pattern), "utf8").toString("base64");
    for (let suffix = 1; suffix <= 100; suffix++) {
      const slug = suffix === 1 ? root : `${root}-${suffix}`;
      const filePath = `content/patterns/${slug}/index.md`;
      const response = await this.request(
        `/repos/${this.options.owner}/${this.options.repo}/contents/${filePath}`,
        {
          method: "PUT",
          body: JSON.stringify({
            message: `Publish pattern: ${pattern.name}`,
            content,
            branch: this.branch,
          }),
        },
      );
      if (response.ok) {
        const data = await response.json() as { commit: { html_url: string } };
        return {
          slug,
          commitUrl: data.commit.html_url,
          publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, "")}/patterns/${slug}/`,
        };
      }
      if (response.status === 422 || response.status === 409) {
        const duplicate = await this.findByCaptureId(pattern.captureId);
        if (duplicate) return duplicate;
        continue;
      }
      throw new Error(`GitHub publication failed (${response.status})`);
    }
    throw new Error("Could not reserve a unique pattern name");
  }
}
