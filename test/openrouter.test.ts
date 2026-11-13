import assert from "node:assert/strict";
import test from "node:test";
import { wav } from "./audio-fixtures.js";
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
    return Response.json({ choices: [{ message: { content: JSON.stringify({ name: "Pass the pen", context: "Mapping", problem: "Dominance", solution: "Take turns", attributionName: "Alex Rivera, Sam Chen", attributionKind: "individual", picture: { x: 0.1, y: 0.2, width: 0.5, height: 0.4, alt: "Two boxes joined by an arrow" } }) } }] });
  };
  const source = await sharp({ create: { width: 20, height: 10, channels: 3, background: "white" } }).png().toBuffer();
  const ai = new OpenRouter("secret", "vision-model", "speech-model", "text-model", mockFetch as typeof fetch);
  const result = await ai.interpretPhoto(source);
  assert.equal(result.name, "Pass the pen");
  assert.deepEqual(result.picture, { x: 0.1, y: 0.2, width: 0.5, height: 0.4, alt: "Two boxes joined by an arrow" });
  assert.match(requests[0].body.messages[0].content[0].text, /Do not invent or redraw/);
  assert.deepEqual(requests[0].body.response_format.json_schema.schema.properties.picture.type, ['object', 'null']);
  assert.equal(result.attributionName, "Alex Rivera, Sam Chen");
  assert.ok(!Object.hasOwn(result, "attributionKind"));
  assert.equal(requests[0].body.response_format.json_schema.schema.properties.attributionName.type, "string");
  assert.match(requests[0].body.messages[0].content[0].text, /contributor names/);
  assert.equal(requests[0].body.model, "vision-model");
  assert.match(requests[0].body.messages[0].content[1].image_url.url, /^data:image\/webp;base64,/);
});

for (const attributionName of [undefined, "", "   ", 123, ["Alex", "Sam"]]) {
  test(`photo omits missing, blank or non-text contributor names: ${JSON.stringify(attributionName)}`, async () => {
    const source = await sharp({ create: { width: 20, height: 10, channels: 3, background: "white" } }).png().toBuffer();
    const ai = new OpenRouter("secret", undefined, undefined, undefined, (async () =>
      Response.json({ choices: [{ message: { content: JSON.stringify({ name: "Take turns", attributionName }) } }] })) as typeof fetch);
    const result = await ai.interpretPhoto(source);
    assert.equal(result.name, "Take turns");
    assert.ok(!Object.hasOwn(result, "attributionName"));
  });
}

for (const picture of [undefined, null, 'a drawing', {},
  { x: -0.1, y: 0, width: 0.5, height: 0.5, alt: 'Drawing' },
  { x: 0.6, y: 0, width: 0.5, height: 0.5, alt: 'Drawing' },
  { x: 0, y: 0, width: 0, height: 0.5, alt: 'Drawing' },
  { x: '0', y: 0, width: 0.5, height: 0.5, alt: 'Drawing' },
  { x: 0, y: 0, width: 0.5, height: 0.5, alt: '   ' },
]) test(`missing or invalid picture leaves text suggestions usable: ${JSON.stringify(picture)}`, async () => {
  const source = await sharp({ create: { width: 20, height: 10, channels: 3, background: 'white' } }).png().toBuffer();
  const ai = new OpenRouter('secret', undefined, undefined, undefined, (async () =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'Take turns', picture }) } }] })) as typeof fetch);
  const result = await ai.interpretPhoto(source);
  assert.equal(result.name, 'Take turns');
  assert.equal(result.picture, undefined);
});

test("suggests concise alt text using the vision model and a metadata-free picture", async () => {
  let body: any;
  const source = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "white" } }).withMetadata().png().toBuffer();
  const ai = new OpenRouter("secret", "vision-model", undefined, undefined, (async (_input, init) => {
    body = JSON.parse(String(init?.body));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ avatarAlt: `  ${"a".repeat(250)}  `, name: "Ignore this" }) } }] });
  }) as typeof fetch);
  assert.equal(await ai.describePicture(source), "a".repeat(240));
  assert.equal(body.model, "vision-model");
  assert.deepEqual(Object.keys(body.response_format.json_schema.schema.properties), ["avatarAlt"]);
  assert.match(body.messages[0].content[0].text, /do not infer identities/i);
  const encoded = body.messages[0].content[1].image_url.url.split(',')[1];
  const metadata = await sharp(Buffer.from(encoded, 'base64')).metadata();
  assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, 1800); assert.equal(metadata.exif, undefined);
});

for (const avatarAlt of [undefined, '', '   ', 123, ['A drawing']]) {
  test(`rejects unusable picture descriptions: ${JSON.stringify(avatarAlt)}`, async () => {
    const source = await sharp({ create: { width: 20, height: 10, channels: 3, background: 'white' } }).png().toBuffer();
    const ai = new OpenRouter('secret', undefined, undefined, undefined, (async () =>
      Response.json({ choices: [{ message: { content: JSON.stringify({ avatarAlt }) } }] })) as typeof fetch);
    await assert.rejects(ai.describePicture(source), /no picture description/);
  });
}

test("picture description propagates provider failures and cancellation", async () => {
  const source = await sharp({ create: { width: 20, height: 10, channels: 3, background: 'white' } }).png().toBuffer();
  const failure = new OpenRouter('secret', undefined, undefined, undefined, (async () => new Response('', { status: 503 })) as typeof fetch);
  await assert.rejects(failure.describePicture(source), /503/);
  const controller = new AbortController(); controller.abort();
  const cancelled = new OpenRouter('secret', undefined, undefined, undefined, (async (_input, init) => {
    init?.signal?.throwIfAborted(); throw new Error('Expected an aborted signal');
  }) as typeof fetch);
  await assert.rejects(cancelled.describePicture(source, controller.signal), /abort/i);
});

test("transcribes speech then produces editable suggestions", async () => {
  const responses = [
    Response.json({ text: "We take turns holding the pen." }),
    Response.json({ choices: [{ message: { content: JSON.stringify({ solution: "Take turns holding the pen.", attributionName: "Not an author" }) } }] }),
  ];
  const mockFetch = async () => responses.shift()!;
  const ai = new OpenRouter("secret", "vision-model", "speech-model", "text-model", mockFetch as typeof fetch);
  const result = await ai.interpretSpeech(wav(), "audio/wav");
  assert.equal(result.transcript, "We take turns holding the pen.");
  assert.equal(result.suggestions.solution, "Take turns holding the pen.");
  assert.ok(!Object.hasOwn(result.suggestions, "attributionName"));
});
