import { DraftBoard, probePage } from "./drafts.js";
import { createApp } from "./app.js";
import { GitHubPublisher } from "./github.js";
import { OpenRouter } from "./openrouter.js";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");
const publisher = new GitHubPublisher({
  token,
  owner: process.env.HANDBOOK_OWNER ?? "mattwynne",
  repo: process.env.HANDBOOK_REPO ?? "explore-ddd-anti-authoritarian-team-practices-workshop",
  publicBaseUrl: process.env.HANDBOOK_URL ?? "https://mattwynne.github.io/explore-ddd-anti-authoritarian-team-practices-workshop/",
});
const ai = process.env.OPENROUTER_API_KEY
  ? new OpenRouter(
      process.env.OPENROUTER_API_KEY,
      process.env.VISION_MODEL,
      process.env.TRANSCRIPTION_MODEL,
      process.env.SYNTHESIS_MODEL,
    )
  : undefined;
const port = Number(process.env.PORT ?? 8080);
createApp(publisher, new DraftBoard(probePage), ai).listen(port, "0.0.0.0", () => console.log(JSON.stringify({ event: "server_started", port })));
