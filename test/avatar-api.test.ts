import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import type { PatternPublisher } from '../src/github.js';
import { diagramFixture } from './diagram-fixtures.js';
import sharp from 'sharp';

test('comparison API publishes only selected metadata-free bytes and preserves reviewed alt text', async () => {
  const calls: Parameters<PatternPublisher['publish']>[] = [];
  const server = createApp({ async publish(...args) { calls.push(args); return { slug: 'a', publicUrl: 'https://example.test/a', commitUrl: 'https://example.test/commit' }; } }).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const upload = (bytes: Buffer, type = 'image/png') => { const form = new FormData(); form.set('avatar', new Blob([new Uint8Array(bytes)], { type }), 'picture'); return form; };
  try {
    const raw = await diagramFixture('shadow');
    const response = await fetch(`${base}/api/avatars/previews`, { method: 'POST', body: upload(raw) });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const choices = await response.json() as Record<string, string>;
    assert.equal(calls.length, 0);
    for (const selection of ['original', 'cleaned']) {
      const chosen = Buffer.from(choices[selection].split(',')[1], 'base64');
      const draft = await (await fetch(`${base}/api/drafts`, { method: 'POST' })).json() as { id: string };
      const form = upload(chosen, 'image/webp');
      for (const [key, value] of Object.entries({ captureId: draft.id, name: 'A', context: 'B', problem: 'C', solution: 'D', attributionKind: 'anonymous', avatarAlt: 'An arrow joining two boxes' })) form.set(key, value);
      const published = await fetch(`${base}/api/patterns`, { method: 'POST', body: form });
      assert.equal(published.status, 201);
      const [pattern, avatar] = calls.at(-1)!;
      assert.equal(pattern.avatarAlt, 'An arrow joining two boxes');
      assert.deepEqual(avatar!.bytes, chosen); assert.notDeepEqual(avatar!.bytes, raw);
      assert.equal((await sharp(avatar!.bytes).metadata()).exif, undefined);
      form.delete('avatarAlt');
      assert.equal((await fetch(`${base}/api/patterns`, { method: 'POST', body: form })).status, 400);
    }
    assert.equal(calls.length, 2);
    for (const body of [new FormData(), upload(Buffer.from('bad')), upload(raw, 'text/plain'), upload(Buffer.alloc(16 * 1024 * 1024 + 1))]) {
      assert.equal((await fetch(`${base}/api/avatars/previews`, { method: 'POST', body })).status, 400);
    }
    assert.equal(calls.length, 2);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('cleanup outage still returns the original and publication never invokes cleanup', async () => {
  let attempts = 0, published = 0;
  const server = createApp({ async publish() { published++; return { slug: 'a', publicUrl: 'url', commitUrl: 'url' }; } }, undefined, undefined,
    async () => { attempts++; throw new Error('cleanup down'); }).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const form = new FormData(); form.set('avatar', new Blob([new Uint8Array(await diagramFixture('pencil'))], { type: 'image/png' }), 'pencil.png');
    const response = await fetch(`${base}/api/avatars/previews`, { method: 'POST', body: form });
    const result = await response.json() as { original: string; cleaned?: string; warning: string };
    assert.equal(response.status, 200); assert.ok(result.original); assert.equal(result.cleaned, undefined); assert.match(result.warning, /still publish/);
    const draft = await (await fetch(`${base}/api/drafts`, { method: 'POST' })).json() as { id: string };
    for (const [key, value] of Object.entries({ captureId: draft.id, name: 'A', context: 'B', problem: 'C', solution: 'D', attributionKind: 'anonymous', avatarAlt: 'Pencil drawing' })) form.set(key, value);
    assert.equal((await fetch(`${base}/api/patterns`, { method: 'POST', body: form })).status, 201);
    assert.equal(attempts, 1); assert.equal(published, 1);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
