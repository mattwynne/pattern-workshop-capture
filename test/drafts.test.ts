import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { DraftBoard, probePage } from '../src/drafts.js';
import { createApp } from '../src/app.js';
import type { AddressInfo } from 'node:net';

test('Git commit waits for reachable Pages; timeout is recoverable and published is monotonic', async () => {
  let live = false, calls = 0;
  const board = new DraftBoard(async () => { calls++; if (!live) throw new Error('SECRET provider'); return true; });
  try {
    const draft = board.create()!;
    board.update(draft.id, { name: 'Reviewed', stage: 'publishing' });
    board.update(draft.id, { name: 'Late' });
    board.committed(draft.id, 'https://handbook.test/patterns/a/');
    assert.equal(board.all()[0].publicUrl, undefined);
    assert.equal(board.all()[0].stage, 'awaiting-pages');
    board.update(draft.id, { name: 'Late', stage: 'failed' });
    for (let i = 0; i < 12; i++) await board.checkPages();
    assert.equal(board.all()[0].stage, 'publication-delayed');
    await board.checkPages(); assert.equal(calls, 12);
    live = true; assert.equal(board.retryPages(draft.id), true); await board.checkPages();
    assert.equal(board.all()[0].stage, 'published');
    assert.equal(board.all()[0].publicUrl, 'https://handbook.test/patterns/a/');
    board.update(draft.id, { stage: 'failed', name: 'Late' });
    assert.equal(board.all()[0].name, 'Reviewed');
    assert.ok(!JSON.stringify(board.all()).includes('SECRET'));
  } finally { board.dispose(); }
});

test('workshop capacity, title bound, snapshot isolation and subscriber lifecycle are bounded', () => {
  const board = new DraftBoard(undefined, 100, 2);
  for (let i = 0; i < 100; i++) { const draft = board.create()!; board.update(draft.id, { name: 'a'.repeat(10000) }); }
  assert.equal(board.create(), null); assert.equal(board.all().length, 100);
  const snapshot = board.all(); snapshot[0].name = 'mutation';
  assert.equal(board.all()[0].name.length, 120);
  class Client extends EventEmitter {
    writableLength = 0; destroyed = false; writableEnded = false; frames: string[] = []; slow = false;
    write(frame: string) { this.frames.push(frame); return !this.slow; }
    destroy() { this.destroyed = true; this.emit('close'); }
    end() { this.writableEnded = true; }
  }
  const a = new Client(), b = new Client(), excess = new Client();
  board.subscribe(a as any); board.subscribe(b as any); board.subscribe(excess as any);
  assert.equal(excess.writableEnded, true);
  assert.equal(JSON.parse(a.frames[0].slice(6)).length, 100);
  a.writableLength = 1_048_577; board.update(snapshot[0].id, { name: 'Next' }); assert.equal(a.destroyed, true);
  const count = a.frames.length; board.update(snapshot[0].id, { name: 'Latest' }); assert.equal(a.frames.length, count);
  b.emit('error', new Error('disconnect'));
  const reconnect = new Client(); board.subscribe(reconnect as any);
  assert.equal(JSON.parse(reconnect.frames[0].slice(6))[0].name, 'Latest');
  board.dispose(); assert.equal(reconnect.destroyed, true);
});

test('API lifecycle guards concurrent retry, redacts private payloads and restores same ID after restart', async () => {
  let release!: () => void, fail = true;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const board = new DraftBoard(async () => true);
  const draft = board.create()!;
  const server = createApp({ async publish() { await gate; if (fail) throw new Error('SECRET required'); return { publicUrl: 'https://handbook.test/a/', slug: 'a', commitUrl: 'SECRET commit' }; } }, board, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = () => fetch(`${base}/api/patterns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ captureId: draft.id, name: 'Visible', context: 'SECRET body', problem: 'SECRET transcript', solution: 'SECRET media', attributionKind: 'anonymous', attributionName: 'SECRET person' }) });
  try {
    const first = post();
    while (board.all()[0].stage !== 'publishing') await new Promise(resolve => setImmediate(resolve));
    assert.equal((await post()).status, 409); assert.equal(board.all()[0].stage, 'publishing');
    release(); const failed = await first; assert.equal(failed.status, 502); assert.ok(!(await failed.text()).includes('SECRET'));
    assert.equal(board.all()[0].stage, 'failed'); fail = false;
    assert.equal((await post()).status, 201); assert.equal(board.all()[0].stage, 'awaiting-pages');
    assert.equal((await fetch(`${base}/api/drafts/${draft.id}/recheck`, { method: 'POST' })).status, 202);
    await board.checkPages(); assert.equal(board.all()[0].stage, 'published');
    assert.ok(!JSON.stringify(board.all()).includes('SECRET'));
    const fresh = new DraftBoard(); assert.equal(fresh.create(draft.id)!.id, draft.id);
    const invalid = await fetch(`${base}/api/drafts/${draft.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '', stage: 'failed', publicUrl: 'javascript:alert(1)', context: 'SECRET' }) });
    assert.equal(invalid.status, 200); assert.equal(board.all()[0].stage, 'published');
  } finally { board.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('publication probe requires HTTP 200 and bounds network behavior', async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [200, 202, 301, 404, 503]) {
      globalThis.fetch = (async (_url, init) => {
        assert.equal(init?.method, 'HEAD'); assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store'); assert.ok(init?.signal);
        return new Response(null, { status });
      }) as typeof fetch;
      assert.equal(await probePage('https://handbook.test/a/'), status === 200);
    }
  } finally { globalThis.fetch = original; }
});

test('API bounds room allocation, restores a browser UUID and allowlists name updates', async () => {
  const board = new DraftBoard(undefined, 1);
  const server = createApp({ async publish() { throw new Error('unused'); } }, board, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const id = '12345678-1234-4123-8123-123456789012';
  try {
    const create = () => fetch(`${base}/api/drafts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    assert.equal((await (await create()).json() as any).id, id);
    assert.equal((await create()).status, 201);
    assert.equal((await fetch(`${base}/api/drafts`, { method: 'POST' })).status, 503);
    const patch = await fetch(`${base}/api/drafts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '', stage: 'published', publicUrl: 'javascript:SECRET', transcript: 'SECRET' }) });
    const body = await patch.json() as any;
    assert.equal(body.name, 'Untitled pattern'); assert.equal(body.stage, 'drafting');
    assert.equal(body.publicUrl, undefined); assert.ok(!JSON.stringify(body).includes('SECRET'));
    assert.equal(patch.headers.get('cache-control'), 'no-store');
  } finally { board.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
