import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { OpenRouter } from '../src/openrouter.js';

const publisher = { async publish() { throw new Error('Descriptions must not publish'); } };
const upload = (bytes: Buffer, type = 'image/png') => {
  const form = new FormData();
  form.set('avatar', new Blob([new Uint8Array(bytes)], { type }), 'picture');
  return form;
};

test('picture description API validates images, strips metadata, and returns uncached editable text', async () => {
  let calls = 0, fail = false;
  const ai = new OpenRouter('secret', undefined, undefined, undefined, (async (_input, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    const url = body.messages[0].content[1].image_url.url;
    const metadata = await sharp(Buffer.from(url.split(',')[1], 'base64')).metadata();
    assert.equal(metadata.exif, undefined); assert.equal(metadata.format, 'webp');
    if (fail) throw new Error('private provider failure');
    return Response.json({ choices: [{ message: { content: JSON.stringify({ avatarAlt: 'Two boxes connected by an arrow' }) } }] });
  }) as typeof fetch);
  const server = createApp(publisher, undefined, ai, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const raw = await sharp({ create: { width: 30, height: 20, channels: 3, background: 'white' } }).withMetadata().png().toBuffer();
  try {
    const response = await fetch(`${base}/api/avatars/description`, { method: 'POST', body: upload(raw) });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { alt: 'Two boxes connected by an arrow' });
    for (const body of [new FormData(), upload(Buffer.from('bad')), upload(raw, 'text/plain'), upload(Buffer.alloc(16 * 1024 * 1024 + 1))]) {
      assert.equal((await fetch(`${base}/api/avatars/description`, { method: 'POST', body })).status, 400);
    }
    assert.equal(calls, 1);
    fail = true;
    const failure = await fetch(`${base}/api/avatars/description`, { method: 'POST', body: upload(raw) });
    assert.equal(failure.status, 502);
    assert.deepEqual(await failure.json(), { error: 'Could not suggest a description. Please describe the picture yourself.' });
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('picture description API without AI leaves a manual description available', async () => {
  const server = createApp(publisher, undefined, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const response = await fetch(`${base}/api/avatars/description`, { method: 'POST', body: new FormData() });
    assert.equal(response.status, 503);
    assert.match((await response.json() as { error: string }).error, /describe the picture yourself/);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
