import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { OpenRouter, audioFormat } from "../src/openrouter.js";

test("maps browser audio MIME types to transcription formats", () => {
  assert.equal(audioFormat("audio/webm;codecs=opus"), "webm");
  assert.equal(audioFormat("audio/mp4"), "m4a");
  assert.equal(audioFormat("video/mp4"), null);
});

test("interprets a temporary card photo as structured suggestions", async () => {
  const requests: Array<{ url: string; body: any }> = [];
  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return Response.json({ choices: [{ message: { content: JSON.stringify({ name: "Pass the pen", context: "Mapping", problem: "Dominance", solution: "Take turns" }) } }] });
  };
  const source = await sharp({ create: { width: 20, height: 10, channels: 3, background: "white" } }).png().toBuffer();
  const ai = new OpenRouter("secret", "vision-model", "speech-model", "text-model", mockFetch as typeof fetch);
  const result = await ai.interpretPhoto(source);
  assert.equal(result.name, "Pass the pen");
  assert.equal(requests[0].body.model, "vision-model");
  assert.match(requests[0].body.messages[0].content[1].image_url.url, /^data:image\/webp;base64,/);
});

test("transcribes speech then produces editable suggestions", async () => {
  const responses = [
    Response.json({ text: "We take turns holding the pen." }),
    Response.json({ choices: [{ message: { content: JSON.stringify({ solution: "Take turns holding the pen." }) } }] }),
  ];
  const mockFetch = async () => responses.shift()!;
  const ai = new OpenRouter("secret", "vision-model", "speech-model", "text-model", mockFetch as typeof fetch);
  const result = await ai.interpretSpeech(Buffer.from("not-real-audio"), "audio/webm");
  assert.equal(result.transcript, "We take turns holding the pen.");
  assert.equal(result.suggestions.solution, "Take turns holding the pen.");
});
