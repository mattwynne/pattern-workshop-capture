import { requestLogging, jsonLog, type LogSink } from "./logging.js";
import express from "express";
import multer from "multer";
import { DraftBoard } from "./drafts.js";
import type { PatternPublisher } from "./github.js";
import { avatarPreviews, cleanAvatar, normalizeAvatar } from "./image.js";
import type { OpenRouter } from "./openrouter.js";
import { validatePattern } from "./pattern.js";

export function createApp(publisher: PatternPublisher, board = new DraftBoard(), ai?: OpenRouter, cleanup: typeof cleanAvatar = cleanAvatar, log: LogSink = jsonLog) {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024, files: 1, fields: 12 } });
  app.use(requestLogging(log));
  app.use("/api", (_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
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
    response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", Connection: "keep-alive" });
    response.flushHeaders();
    const unsubscribe = board.subscribe(response);
    request.on("close", unsubscribe);
  });
  app.post("/api/interpret/photo", upload.single("photo"), async (request, response) => {
    if (!ai) return response.status(503).json({ error: "AI interpretation is not configured" });
    if (!request.file) return response.status(400).json({ error: "Choose a card photo first" });
    try {
      response.json({ suggestions: await ai.interpretPhoto(request.file.buffer) });
    } catch (error) {
      response.status(502).json({ error: "Photo interpretation failed. Try again or enter the fields manually." });
    }
  });
  app.post("/api/interpret/audio", upload.single("audio"), async (request, response) => {
    if (!ai) return response.status(503).json({ error: "AI interpretation is not configured" });
    if (!request.file) return response.status(400).json({ error: "Record or choose some audio first" });
    try {
      response.json(await ai.interpretSpeech(request.file.buffer, request.file.mimetype));
    } catch (error) {
      response.status(502).json({ error: "Transcription failed. Try again or enter the fields manually." });
    }
  });
  // Request-local only: no raw images, previews or selection state are stored.
  app.post("/api/avatars/previews", upload.single("avatar"), async (request, response) => {
    response.set("Cache-Control", "no-store");
    if (!request.file) return response.status(400).json({ error: "Choose a picture first" });
    try {
      const previews = await avatarPreviews(request.file.buffer, request.file.mimetype, cleanup);
      const dataUrl = (image: typeof previews.original) => `data:image/webp;base64,${image.bytes.toString("base64")}`;
      response.json({ original: dataUrl(previews.original), cleaned: previews.cleaned ? dataUrl(previews.cleaned) : undefined, warning: previews.warning });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : "Choose another image" });
    }
  });
  app.post("/api/patterns", upload.single("avatar"), async (request, response) => {
    let validated = false;
    try {
      const pattern = validatePattern(request.body);
      if (request.file && !pattern.avatarAlt) throw new Error("A picture description is required");
      if (!request.file) pattern.avatarAlt = undefined;
      if (!board.update(pattern.captureId, { name: pattern.name, stage: "publishing" })) {
        return response.status(409).json({ error: "This draft expired; reload and try again" });
      }
      const avatar = request.file
        ? await normalizeAvatar(request.file.buffer, request.file.mimetype)
        : undefined;
      validated = true;
      const published = await publisher.publish(pattern, avatar);
      board.update(pattern.captureId, { stage: "published", publicUrl: published.publicUrl });
      response.status(201).json(published);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publication failed";
      if (request.body?.captureId) board.update(request.body.captureId, { stage: "failed" });
      const validation = !validated && /required|Choose|Enter/.test(message);
      response.status(validation ? 400 : 502).json({ error: validation ? message : "Publication could not be confirmed. Try publishing again; your draft is safe." });
    }
  });
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "The upload must be smaller than 16 MB"
      : "The upload could not be processed";
    response.status(400).json({ error: message });
  });
  return app;
}
