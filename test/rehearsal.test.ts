import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { DraftBoard } from '../src/drafts.js';
import { OpenRouter } from '../src/openrouter.js';
import { diagramFixture } from './diagram-fixtures.js';

const details = { name: 'Public title', context: 'SECRET context', problem: 'SECRET problem', solution: 'SECRET solution', attributionKind: 'individual', attributionName: 'SECRET person' };
test('50 HTTP clients publish 100 patterns with live dashboard convergence, reconnect and privacy', { timeout: 30000 }, async t => {
  const board = new DraftBoard(async () => true), logs: unknown[] = [];
  const server = createApp({ async publish(p) { return { slug: p.captureId, publicUrl: `https://handbook.test/patterns/${p.captureId}/`, commitUrl: 'https://github.test/commit' }; } }, board, undefined, undefined, record => logs.push(record)).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const controllers: AbortController[] = [];
  const snapshots: any[][] = [];
  const consumers: Promise<void>[] = [];
  async function subscribe(index: number) {
    const controller = new AbortController(); controllers.push(controller);
    const response = await fetch(`${base}/api/dashboard/events`, { signal: controller.signal });
    assert.match(response.headers.get('content-type')!, /text\/event-stream/);
    consumers.push((async () => {
      let pending = '';
      try { for await (const chunk of response.body!) {
        pending += new TextDecoder().decode(chunk);
        const frames = pending.split('\n\n'); pending = frames.pop()!;
        for (const frame of frames) if (frame.startsWith('data: ')) snapshots[index] = JSON.parse(frame.slice(6));
      } } catch (error) { if (!controller.signal.aborted) throw error; }
    })());
  }
  try {
    await Promise.all(Array.from({ length: 5 }, (_, i) => subscribe(i)));
    const start = performance.now();
    await Promise.all(Array.from({ length: 50 }, async () => {
      for (let i = 0; i < 2; i++) {
        const created = await fetch(`${base}/api/drafts`, { method: 'POST' });
        const { id } = await created.json() as { id: string };
        const response = await fetch(`${base}/api/patterns?private=SECRET`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer SECRET' }, body: JSON.stringify({ ...details, captureId: id }) });
        assert.equal(response.status, 201);
      }
    }));
    for (let tick = 0; tick < 20; tick++) { await board.checkPages(); await new Promise(resolve => setImmediate(resolve)); }
    const elapsed = performance.now() - start;
    t.diagnostic(`50 clients / 100 patterns / 5 live subscribers: ${Math.round(elapsed)}ms locally (stub publisher)`);
    assert.ok(elapsed < 15000, 'local rehearsal must finish within 15 seconds');
    controllers[0].abort(); await subscribe(5);
    await new Promise(resolve => setTimeout(resolve, 100));
    for (const index of [1, 2, 3, 4, 5]) {
      assert.equal(snapshots[index].length, 100);
      assert.ok(snapshots[index].every(draft => draft.stage === 'published' && draft.publicUrl));
      assert.ok(!JSON.stringify(snapshots[index]).includes('SECRET'));
      assert.deepEqual(snapshots[index], board.all());
    }
    assert.ok(!JSON.stringify(logs).includes('SECRET'));
    const publishLog = logs.find((record: any) => record.route === '/api/patterns') as any;
    assert.equal(publishLog.status, 201); assert.ok(publishLog.requestId); assert.equal(typeof publishLog.durationMs, 'number');
  } finally {
    controllers.forEach(controller => controller.abort()); await Promise.allSettled(consumers);
    board.dispose();
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

for (const mode of ['photo', 'audio']) {
  test(`${mode} provider failure returns a redacted error and leaves manual publishing usable`, async () => {
    const ai = { async interpretPhoto() { throw new Error('SECRET provider payload'); }, async interpretSpeech() { throw new Error('SECRET recording'); } } as unknown as OpenRouter;
    const board = new DraftBoard(), logs: unknown[] = [], published: unknown[] = [];
    const server = createApp({ async publish(p, avatar) { published.push([p, avatar]); return { slug: 'a', publicUrl: 'https://handbook.test/a', commitUrl: 'commit' }; } }, board, ai, undefined, record => logs.push(record)).listen(0);
    await new Promise<void>(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const form = new FormData(); form.set(mode, new Blob(['SECRET media']), 'SECRET-filename');
      const response = await fetch(`${base}/api/interpret/${mode}`, { method: 'POST', body: form });
      assert.equal(response.status, 502); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.ok(!(await response.text()).includes('SECRET'));
      assert.equal(published.length, 0); assert.equal(board.all().length, 0);
      const draft = board.create()!;
      assert.equal((await fetch(`${base}/api/patterns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, captureId: draft.id }) })).status, 201);
      assert.equal((published[0] as any)[1], undefined); assert.ok(!JSON.stringify(logs).includes('SECRET'));
    } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });
}

for (const fault of ['429', '503', 'timeout', 'malformed', 'empty']) {
  test(`OpenRouter ${fault} is bounded and rejected`, async () => {
    const ai = new OpenRouter('secret', undefined, undefined, undefined, (async (_url, init) => {
      assert.ok(init?.signal, 'external calls have deadlines');
      if (fault === 'timeout') throw new DOMException('Timed out', 'TimeoutError');
      if (fault === 'malformed') return Response.json({ choices: [{ message: { content: '{broken' } }] });
      if (fault === 'empty') return Response.json({});
      return new Response('sensitive details', { status: Number(fault) });
    }) as typeof fetch);
    await assert.rejects(ai.interpretPhoto(await diagramFixture('marker')));
  });
}

test('server rejects a generated 126-second WAV before calling OpenRouter', async () => {
  const samples = 8000 * 126, wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  const ai = new OpenRouter('secret', undefined, undefined, undefined, (async () => { assert.fail('oversized recording must not reach provider'); }) as typeof fetch);
  await assert.rejects(ai.interpretSpeech(wav, 'audio/wav'), /two minutes/);
});

test('published dashboard cards cannot regress after late edits or failed retries', () => {
  const board = new DraftBoard(), draft = board.create()!;
  board.update(draft.id, { name: 'Reviewed name', stage: 'published', publicUrl: 'https://handbook.test/pattern' });
  board.update(draft.id, { name: 'Late provisional name' });
  board.update(draft.id, { stage: 'failed' });
  assert.equal(board.all()[0].name, 'Reviewed name'); assert.equal(board.all()[0].stage, 'published');
});

test('slow dashboard subscribers are disconnected before unbounded buffering', () => {
  const board = new DraftBoard(); let destroyed = 0;
  const response = { writableLength: 1_048_577, destroy() { destroyed++; }, write() { assert.fail('must not queue more data'); } };
  const unsubscribe = board.subscribe(response as any); unsubscribe();
  assert.equal(destroyed, 1);
});

test('publisher exceptions cannot leak details through validation-looking messages', async () => {
  const board = new DraftBoard(); const draft = board.create()!;
  const server = createApp({ async publish() { throw new Error('SECRET token required'); } }, board, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/patterns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, captureId: draft.id }) });
    assert.equal(response.status, 502); assert.ok(!(await response.text()).includes('SECRET'));
    assert.equal(board.all()[0].stage, 'failed');
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
