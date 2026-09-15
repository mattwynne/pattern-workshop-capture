import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { DraftBoard } from '../src/drafts.js';

test('health is uncached local liveness, independent of JSON payload and provider failures', async () => {
  const logs: Record<string, string | number>[] = [];
  const board = new DraftBoard();
  const server = createApp({ async publish() { assert.fail('health must not call GitHub'); } }, board,
    undefined, undefined, record => logs.push(record)).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const { request } = await import('node:http');
    const result = await new Promise<{ status: number; cache?: string; body: string }>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port: (server.address() as AddressInfo).port,
        path: '/health?secret=PRIVATE_QUERY', method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Content-Length': '1', Authorization: 'PRIVATE_HEADER' },
      }, response => {
        let body = ''; response.on('data', chunk => body += chunk);
        response.on('end', () => resolve({ status: response.statusCode!, cache: response.headers['cache-control'], body }));
      });
      req.on('error', reject); req.end('{');
    });
    assert.equal(result.status, 200);
    assert.equal(result.cache, 'no-store');
    assert.deepEqual(JSON.parse(result.body), { ok: true });
    assert.equal(logs[0].route, '/health');
    assert.ok(!JSON.stringify(logs).includes('PRIVATE'));
  } finally { board.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

for (const [name, env, message] of [
  ['missing token', {}, 'GITHUB_TOKEN is required'],
  ['invalid port', { GITHUB_TOKEN: 'PRIVATE_TOKEN', PORT: 'PRIVATE_PORT' }, 'PORT must be an integer'],
  ['missing decoder', { GITHUB_TOKEN: 'PRIVATE_TOKEN', PORT: '8080', PATH: '/nonexistent' }, 'FFmpeg is required'],
] as const) {
  test(`production startup rejects ${name} without logging config values`, () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
      env: { PATH: process.env.PATH, NODE_ENV: 'production', ...env }, encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(message));
    assert.ok(!(result.stdout + result.stderr).includes('PRIVATE_'));
    assert.ok(!result.stdout.includes('server_started'));
  });
}
