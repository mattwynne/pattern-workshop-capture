import { requestLogging, jsonLog, type LogSink } from "./logging.js";
import { AudioValidationError } from "./audio.js";
import express from "express";
import multer from "multer";
import { DraftBoard } from "./drafts.js";
import type { PatternPublisher } from "./github.js";
import { avatarPreviews, cleanAvatar, normalizeAvatar } from "./image.js";
import type { OpenRouter } from "./openrouter.js";
import { validatePattern } from "./pattern.js";

export function createApp(publisher: PatternPublisher, board = new DraftBoard(), ai?: OpenRouter, cleanup: typeof cleanAvatar = cleanAvatar, log: LogSink = jsonLog) {
  const app = express();
  const inFlight = new Set<string>();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024, files: 1, fields: 12 } });
  const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024, files: 1, fields: 0, parts: 2 } });
  app.use(requestLogging(log));
  app.use("/api", (_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
  // Liveness is local and independent of payload parsers, caches and providers.
  app.get("/health", (_request, response) => response.set("Cache-Control", "no-store").json({ ok: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static("public"));

  app.post("/api/drafts", (request, response) => {
    const id = request.body?.id;
    if (id !== undefined && (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))) return response.status(400).json({ error: 'Invalid draft ID' });
    const draft = board.create(id);
    return draft ? response.status(201).json(draft) : response.status(503).json({ error: 'The room board is full or the draft ID is invalid. Your text remains in this browser.' });
  });
  app.patch("/api/drafts/:id", (request, response) => {
    const name = typeof request.body?.name === "string" ? request.body?.name.trim().slice(0, 120) : undefined;
    const draft = board.update(request.params.id, name !== undefined ? { name } : {});
    if (!draft) return response.status(404).json({ error: "Draft not found; start again" });
    response.json(draft);
  });
  app.post('/api/drafts/:id/recheck', (request, response) => {
    response.status(board.retryPages(request.params.id) ? 202 : 409).json({ message: 'Check the room dashboard for publication status.' });
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
  app.post("/api/interpret/audio", audioUpload.single("audio"), async (request, response) => {
    if (!ai) return response.status(503).json({ error: "AI interpretation is not configured" });
    if (!request.file) return response.status(400).json({ error: "Record or choose some audio first" });
    const controller = new AbortController();
    const cancel = () => { if (!response.writableEnded) controller.abort(); };
    response.on("close", cancel);
    try {
      response.json(await ai.interpretSpeech(request.file.buffer, request.file.mimetype, controller.signal));
    } catch (error) {
      if (!response.destroyed) response.status(error instanceof AudioValidationError ? 400 : 502).json({
        error: error instanceof AudioValidationError ? error.message : "Transcription failed. Try again or enter the fields manually.",
      });
    } finally {
      response.off("close", cancel);
      request.file.buffer = Buffer.alloc(0);
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
    let activeId: string | undefined;
    try {
      const pattern = validatePattern(request.body);
      if (inFlight.has(pattern.captureId)) return response.status(409).json({ error: 'This draft is already publishing. Wait before retrying.' });
      activeId = pattern.captureId;
      inFlight.add(activeId);
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
      board.committed(pattern.captureId, published.publicUrl);
      response.status(201).json(published);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publication failed";
      if (activeId) board.update(activeId, { stage: "failed" });
      const validation = !validated && /required|Choose|Enter/.test(message);
      response.status(validation ? 400 : 502).json({ error: validation ? message : "Publication could not be confirmed. Try publishing again; your draft is safe." });
    } finally { if (activeId) inFlight.delete(activeId); }
  });
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "The upload must be smaller than 16 MB"
      : "The upload could not be processed";
    response.status(400).json({ error: message });
  });
  return app;
}
