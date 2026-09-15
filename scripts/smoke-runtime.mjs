// Runs inside the exact production container via stdin; only Node built-ins and
// production modules are available. No credentials or external requests required.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const require = createRequire(`${process.cwd()}/package.json`);
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(process.env.NODE_ENV, 'production');
assert.notEqual(process.getuid(), 0, 'runtime must be unprivileged');
for (const dependency of Object.keys(manifest.dependencies)) require.resolve(dependency);
for (const dependency of Object.keys(manifest.devDependencies)) {
  assert.throws(() => require.resolve(`${dependency}/package.json`), { code: 'MODULE_NOT_FOUND' });
}
for (const path of ['dist/test', 'test', 'src', '.env', '.git', 'artifacts']) assert.equal(existsSync(path), false, path);
assert.match(execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }), /^ffmpeg version/);
const sharp = require('sharp');
const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } }).png().toBuffer();
const { normalizeAvatar } = await import(`${process.cwd()}/dist/src/image.js`);
assert.equal((await sharp((await normalizeAvatar(png, 'image/png')).bytes).metadata()).format, 'webp');
// A finite canonical WAV avoids FFmpeg's streaming-WAV unknown-length header.
const pcm = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.1', '-ar', '16000', '-ac', '1', '-f', 's16le', 'pipe:1']);
const header = Buffer.alloc(44);
header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28); header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
const wav = Buffer.concat([header, pcm]);
const { normalizeAudio } = await import(`${process.cwd()}/dist/src/audio.js`);
const audio = await normalizeAudio(wav, 'audio/wav');
assert.equal(audio.toString('ascii', 0, 4), 'RIFF');
assert.equal(audio.length, 44 + 1600 * 2);

const base = `http://127.0.0.1:${process.env.PORT}`;
let ready = false;
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1000) });
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
    assert.equal(health.headers.get('cache-control'), 'no-store');
    ready = true; break;
  } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
}
assert.ok(ready, 'production entrypoint must become healthy');
for (const path of ['/', '/capture.js', '/dashboard.html', '/dashboard.js']) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 200, path);
  assert.ok((await response.text()).length > 100, path);
}
const response = await fetch(`${base}/api/drafts?private=SMOKE_PRIVATE_QUERY`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer SMOKE_PRIVATE_HEADER' },
  body: '{"id":"SMOKE_PRIVATE_BODY"}', signal: AbortSignal.timeout(2000),
});
assert.equal(response.status, 400);
assert.ok(!(await response.text()).includes('SMOKE_PRIVATE'));
assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
console.log('Production smoke passed: non-root, production-only dependencies, FFmpeg decode, Sharp WebP, startup, health, assets, redacted API.');
