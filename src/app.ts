import express from "express";
import { DraftBoard } from "./drafts.js";
import type { PatternPublisher } from "./github.js";
import { validatePattern } from "./pattern.js";

export function createApp(publisher: PatternPublisher, board = new DraftBoard()) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static("public"));

  app.get("/health", (_request, response) => response.json({ ok: true }));
  app.post("/api/drafts", (_request, response) => response.status(201).json(board.create()));
  app.patch("/api/drafts/:id", (request, response) => {
    const name = typeof request.body.name === "string" ? request.body.name.trim().slice(0, 120) : undefined;
    const draft = board.update(request.params.id, name ? { name } : {});
    if (!draft) return response.status(404).json({ error: "Draft not found; start again" });
    response.json(draft);
  });
  app.get("/api/dashboard/events", (request, response) => {
    response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    response.flushHeaders();
    const unsubscribe = board.subscribe(response);
    request.on("close", unsubscribe);
  });
  app.post("/api/patterns", async (request, response) => {
    try {
      const pattern = validatePattern(request.body);
      if (!board.update(pattern.captureId, { name: pattern.name, stage: "publishing" })) {
        return response.status(409).json({ error: "This draft expired; reload and try again" });
      }
      const published = await publisher.publish(pattern);
      board.update(pattern.captureId, { stage: "published", publicUrl: published.publicUrl });
      response.status(201).json(published);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publication failed";
      if (request.body?.captureId) board.update(request.body.captureId, { stage: "failed" });
      const validation = /required|Choose|Enter/.test(message);
      response.status(validation ? 400 : 502).json({ error: message });
    }
  });
  return app;
}
