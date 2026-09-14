import { createApp } from "./app.js";
import { GitHubPublisher } from "./github.js";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");
const publisher = new GitHubPublisher({
  token,
  owner: process.env.HANDBOOK_OWNER ?? "mattwynne",
  repo: process.env.HANDBOOK_REPO ?? "explore-ddd-anti-authoritarian-team-practices-workshop",
  publicBaseUrl: process.env.HANDBOOK_URL ?? "https://mattwynne.github.io/explore-ddd-anti-authoritarian-team-practices-workshop/",
});
const port = Number(process.env.PORT ?? 8080);
createApp(publisher).listen(port, "0.0.0.0", () => console.log(`Capture app listening on ${port}`));
