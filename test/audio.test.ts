import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { normalizeAudio, MAX_AUDIO_BYTES } from '../src/audio.js';
import { OpenRouter } from '../src/openrouter.js';
import { createApp } from '../src/app.js';
import { DraftBoard } from '../src/drafts.js';
import { wav, encodedAudio } from './audio-fixtures.js';

for (const [format, mime] of [['webm', 'audio/webm;codecs=opus'], ['mp4', 'audio/mp4'], ['ogg', 'audio/ogg'], ['adts', 'audio/aac'], ['mp3', 'audio/mpeg']]) {
  test(`decodes ${format} from pipes without trusting duration metadata or forwarding private tags`, async () => {
    const source = encodedAudio(format);
    const result = await normalizeAudio(source, mime);
    assert.equal(result.toString('ascii', 0, 4), 'RIFF');
    assert.equal(result.readUInt32LE(40), result.length - 44);
    assert.ok(result.length > 44); assert.ok(!result.includes('PRIVATE'));
  });
}

test('enforces exact sample duration, byte limit and container validity before provider calls', async () => {
  assert.deepEqual(await normalizeAudio(wav(120), 'audio/wav'), wav(120));
  for (const [bytes, mime, message] of [
    [wav(120.01), 'audio/wav', /two minutes/],
    [encodedAudio('webm', 121), 'audio/webm', /two minutes/],
    [encodedAudio('mp4', 121), 'audio/mp4', /two minutes/],
    [Buffer.alloc(MAX_AUDIO_BYTES + 1), 'audio/wav', /16 MiB/],
    [Buffer.alloc(0), 'audio/wav', /empty/],
    [Buffer.from('private invalid media'), 'audio/webm', /could not be read/],
    [wav(), 'audio/mp4', /could not be read/],
    [wav(), 'text/plain', /not supported/],
  ] as const) await assert.rejects(normalizeAudio(bytes, mime), message);
});

test('speech uses configurable models, WAV-only payload, deadline and allowlisted suggestions', async () => {
  const calls: any[] = [];
  const ai = new OpenRouter('PRIVATE KEY', 'vision', 'speech', 'synthesis', (async (url, init) => {
    assert.ok(init?.signal); calls.push({ url, body: JSON.parse(String(init?.body)) });
    return calls.length === 1 ? Response.json({ text: '  PRIVATE transcript  ' })
      : Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'Suggested', context: '', problem: 12, attributionName: 'bad' }) } }] });
  }) as typeof fetch);
  assert.deepEqual(await ai.interpretSpeech(encodedAudio('mp4'), 'audio/mp4'), { transcript: 'PRIVATE transcript', suggestions: { name: 'Suggested' } });
  assert.equal(calls[0].body.model, 'speech'); assert.equal(calls[0].body.input_audio.format, 'wav');
  assert.equal(Buffer.from(calls[0].body.input_audio.data, 'base64').includes('PRIVATE'), false);
  assert.equal(calls[1].body.model, 'synthesis'); assert.match(calls[1].body.messages[0].content, /PRIVATE transcript/);
});

for (const fault of ['429', '503', 'empty', 'wrong-type', 'malformed', 'timeout']) {
  test(`speech ${fault} fails safely and synthesis failure retains transcript`, async () => {
    const fail: typeof fetch = async (_url, init) => {
      if (fault === 'timeout') return new Promise((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
      });
      if (fault === 'malformed') return new Response('{broken');
      if (fault === 'empty') return Response.json({});
      if (fault === 'wrong-type') return Response.json({ text: 123 });
      return new Response('PRIVATE', { status: Number(fault) });
    };
    await assert.rejects(new OpenRouter('test', undefined, undefined, undefined, fail, 10).interpretSpeech(wav(), 'audio/wav'));
    let count = 0;
    const ai = new OpenRouter('test', undefined, undefined, undefined, async (...args) => ++count === 1 ? Response.json({ text: 'Retained transcript' }) : fail(...args), 10);
    const result = await ai.interpretSpeech(wav(), 'audio/wav');
    assert.equal(result.transcript, 'Retained transcript'); assert.deepEqual(result.suggestions, {}); assert.match(result.warning!, /manually/);
  });
}

test('audio API rejects uploads clearly, redacts logs and never adds media to board or publication', async () => {
  let calls = 0, publishes = 0; const logs: unknown[] = []; const board = new DraftBoard();
  const ai = new OpenRouter('PRIVATE KEY', undefined, undefined, undefined, (async () => {
    calls++; return Response.json({ text: 'PRIVATE TRANSCRIPT', choices: [{ message: { content: '{"solution":"Optional"}' } }] });
  }) as typeof fetch);
  const server = createApp({ async publish() { publishes++; throw new Error('unexpected'); } }, board, ai, undefined, record => logs.push(record)).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const [bytes, mime, expected] of [[wav(), 'audio/wav', 200], [wav(120.01), 'audio/wav', 400], [wav(), 'video/mp4', 400], [Buffer.from('PRIVATE'), 'audio/webm', 400], [Buffer.alloc(MAX_AUDIO_BYTES + 1), 'audio/wav', 400]] as const) {
      const body = new FormData(); body.set('audio', new Blob([new Uint8Array(bytes)], { type: mime }), 'PRIVATE FILENAME');
      const response = await fetch(`${base}/api/interpret/audio?PRIVATE`, { method: 'POST', body });
      assert.equal(response.status, expected); assert.equal(response.headers.get('cache-control'), 'no-store');
      if (expected !== 200) assert.ok(!(await response.text()).includes('PRIVATE'));
    }
    for (const extra of ['field', 'file', 'wrong-name']) {
      const body = new FormData(); body.set('audio', new Blob([new Uint8Array(wav())], { type: 'audio/wav' }), 'audio.wav');
      if (extra === 'field') body.set('duration', '1');
      if (extra === 'file') body.append('audio', new Blob(['extra']), 'extra');
      if (extra === 'wrong-name') { body.delete('audio'); body.set('other', new Blob(['extra']), 'extra'); }
      assert.equal((await fetch(`${base}/api/interpret/audio`, { method: 'POST', body })).status, 400);
    }
    assert.equal(calls, 2); assert.equal(publishes, 0); assert.deepEqual(board.all(), []);
    assert.ok(!JSON.stringify(logs).includes('PRIVATE'));
    assert.equal((await fetch(`${base}/api/interpret/audio`, { method: 'POST', body: new FormData() })).status, 400);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('missing file MIME is detected from bytes; cancelled processing never reaches provider', async () => {
  assert.deepEqual(await normalizeAudio(wav(), ''), wav());
  assert.ok((await normalizeAudio(encodedAudio('mp4'), 'application/octet-stream')).length > 44);
  await assert.rejects(normalizeAudio(Buffer.from('unrecognised'), ''), /not supported/);
  const controller = new AbortController(); controller.abort();
  const ai = new OpenRouter('test', undefined, undefined, undefined, async () => { assert.fail('cancelled request reached provider'); });
  await assert.rejects(ai.interpretSpeech(wav(), 'audio/wav', controller.signal), /cancelled/);
});

test('disconnect aborts the in-flight provider request', async () => {
  let started!: () => void, cancelled!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  const aborted = new Promise<void>(resolve => { cancelled = resolve; });
  const ai = new OpenRouter('test', undefined, undefined, undefined, async (_url, init) => {
    started(); return new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => { cancelled(); reject(new Error('cancelled')); }, { once: true }));
  });
  const server = createApp({ async publish() { throw new Error('unexpected'); } }, undefined, ai, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const controller = new AbortController(); const body = new FormData(); body.set('audio', new Blob([new Uint8Array(wav())], { type: 'audio/wav' }), 'private.wav');
    const request = fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/interpret/audio`, { method: 'POST', body, signal: controller.signal }).catch(() => {});
    await ready; controller.abort(); await request;
    await Promise.race([aborted, new Promise((_resolve, reject) => { const timer = setTimeout(() => reject(new Error('provider was not aborted')), 1000); timer.unref(); })]);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
