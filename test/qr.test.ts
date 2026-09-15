import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { createRequire } from 'node:module';
const jsQR = createRequire(import.meta.url)('jsqr') as (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

test('QR CLI produces a decodable printable code for an eventual deployed URL', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'workshop-qr-'));
  try {
    const url = 'https://eventual-capture.example.test/';
    execFileSync('node', ['--import', 'tsx', 'scripts/qr.ts', url, directory]);
    const png = PNG.sync.read(await readFile(join(directory, 'workshop-qr.png')));
    assert.equal(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data, url);
    assert.match(await readFile(join(directory, 'workshop-qr.svg'), 'utf8'), /<svg/);
    assert.throws(() => execFileSync('node', ['--import', 'tsx', 'scripts/qr.ts', 'http://unsafe.test', directory], { stdio: 'pipe' }));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
