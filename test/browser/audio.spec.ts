import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app.js';
import { wav } from '../audio-fixtures.js';
let server: Server, base: string;
test.beforeAll(async () => {
  server = createApp({ async publish() { return { slug: 'manual', publicUrl: 'https://handbook.test/manual', commitUrl: 'commit' }; } }, undefined, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });

async function recorderMock(page: import('@playwright/test').Page, mime = 'audio/mp4', permissionPending = false) {
  await page.addInitScript(({ mime, permissionPending }) => {
    const state: any = { calls: 0, tracks: [], recorders: [], mime };
    (window as any).audioTest = state;
    navigator.mediaDevices.getUserMedia = async () => {
      state.calls++;
      const track: any = new EventTarget(); track.readyState = 'live'; track.stop = () => { track.readyState = 'ended'; };
      state.tracks.push(track); const stream = { getTracks: () => [track] };
      if (permissionPending) await new Promise(resolve => { state.grant = resolve; });
      return stream as any;
    };
    class Recorder extends EventTarget {
      static isTypeSupported(type: string) { return type === mime; }
      state = 'inactive'; mimeType: string;
      constructor(_stream: unknown, options?: { mimeType: string }) { super(); this.mimeType = options?.mimeType || ''; state.recorders.push(this); }
      start() { if (state.startError) throw new Error('start failure'); this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        queueMicrotask(() => {
          this.dispatchEvent(new MessageEvent('dataavailable', { data: new Blob(state.empty ? [] : ['synthetic packets'], { type: this.mimeType }) }));
          this.dispatchEvent(new Event('stop'));
        });
      }
    }
    (window as any).MediaRecorder = Recorder;
  }, { mime, permissionPending });
  await page.goto(base);
}

for (const mime of ['audio/mp4', 'audio/webm;codecs=opus']) test(`${mime} stop keeps final chunks, correct extension, explicit fields and page-only transcript`, async ({ page }) => {
  await recorderMock(page, mime);
  for (const field of ['name', 'context', 'problem', 'solution']) await page.locator(`#${field}`).fill(`Authored ${field}`);
  await page.route('**/api/interpret/audio', async route => {
    const body = route.request().postDataBuffer()!.toString();
    expect(body).toContain(mime.includes('mp4') ? 'explanation.m4a' : 'explanation.webm');
    expect(body).toContain('synthetic packets');
    await route.fulfill({ json: { transcript: 'PRIVATE transcript', suggestions: { name: 'Suggested', solution: 'Suggested solution', attributionName: 'Untrusted' } } });
  });
  await page.locator('#record-audio').click();
  await expect(page.locator('#interpret-audio')).toBeDisabled(); await expect(page.locator('#audio-file')).toBeDisabled();
  await page.locator('#record-audio').click(); await expect(page.locator('#interpret-audio')).toBeEnabled();
  expect(await page.evaluate(() => (window as any).audioTest.tracks.every((t: any) => t.readyState === 'ended'))).toBeTruthy();
  await page.locator('#interpret-audio').click(); await expect(page.locator('#transcript')).toContainText('PRIVATE transcript');
  await expect(page.locator('#name')).toHaveValue('Authored name');
  await expect(page.getByRole('button', { name: 'Use attributionName' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Use solution', exact: true }).click();
  await expect(page.locator('#solution')).toHaveValue('Suggested solution'); await expect(page.locator('#context')).toHaveValue('Authored context');
  await page.locator('#solution').fill('Edited after use');
  await expect(page.getByRole('button', { name: 'Use solution', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Use all', exact: true }).click();
  await expect(page.locator('#solution')).toHaveValue('Edited after use');
  await expect(page.locator('#name')).toHaveValue('Suggested');
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).not.toContain('PRIVATE'); expect(stored).not.toContain('synthetic packets'); expect(stored).not.toContain('explanation.');
  await page.setViewportSize({ width: 320, height: 740 });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.reload(); await expect(page.locator('#transcript')).toBeHidden(); await expect(page.locator('#interpret-audio')).toBeDisabled();
});

test('permission is single-flight and cancellation stops a late granted stream', async ({ page }) => {
  await recorderMock(page, 'audio/mp4', true);
  await page.locator('#record-audio').click(); await expect(page.locator('#record-audio')).toBeDisabled();
  await page.locator('#cancel-audio').click();
  await page.evaluate(() => (window as any).audioTest.grant());
  await expect.poll(() => page.evaluate(() => (window as any).audioTest.tracks[0].readyState)).toBe('ended');
  expect(await page.evaluate(() => (window as any).audioTest.calls)).toBe(1);
  await expect(page.locator('#interpret-audio')).toBeDisabled();
});

for (const outcome of ['cancel', 'error', 'ended', 'pagehide', 'hidden', 'empty', 'start-error']) test(`recorder ${outcome} cleans up without exposing stale audio`, async ({ page }) => {
  await recorderMock(page);
  await page.evaluate(outcome => { (window as any).audioTest.empty = outcome === 'empty'; (window as any).audioTest.startError = outcome === 'start-error'; }, outcome);
  await page.locator('#record-audio').click();
  if (outcome === 'cancel') await page.locator('#cancel-audio').click();
  else if (outcome === 'empty') await page.locator('#record-audio').click();
  else if (outcome !== 'start-error') await page.evaluate(outcome => {
    const state = (window as any).audioTest;
    if (outcome === 'error') state.recorders[0].dispatchEvent(new Event('error'));
    if (outcome === 'ended') state.tracks[0].dispatchEvent(new Event('ended'));
    if (outcome === 'pagehide') window.dispatchEvent(new Event('pagehide'));
    if (outcome === 'hidden') { Object.defineProperty(document, 'hidden', { value: true }); document.dispatchEvent(new Event('visibilitychange')); }
  }, outcome);
  await expect(page.locator('#interpret-audio')).toBeDisabled(); await expect(page.locator('#record-audio')).toBeEnabled();
  expect(await page.evaluate(() => (window as any).audioTest.tracks.every((t: any) => t.readyState === 'ended'))).toBeTruthy();
});

test('elapsed clock stops at two minutes and replacement cannot reuse old recording', async ({ page }) => {
  await page.clock.install(); await recorderMock(page);
  await page.locator('#record-audio').click(); await page.clock.runFor(120_000);
  await expect(page.locator('#recording-time')).toContainText('Recorded 120s');
  await expect(page.locator('#interpret-audio')).toBeEnabled();
  await page.locator('#record-audio').click(); await page.locator('#cancel-audio').click();
  await expect(page.locator('#interpret-audio')).toBeDisabled();
});

test('unsupported browser exposes file fallback and accessible status', async ({ page }) => {
  await page.addInitScript(() => { (window as any).MediaRecorder = undefined; }); await page.goto(base);
  await expect(page.locator('#record-audio')).toBeDisabled(); await expect(page.locator('#audio-status')).toContainText('not supported');
  await page.locator('#audio-file').setInputFiles({ name: 'speech.wav', mimeType: 'audio/wav', buffer: wav() });
  await expect(page.locator('#interpret-audio')).toBeEnabled();
});

test('cancel and timeout ignore late results and manual review remains available', async ({ page }) => {
  await page.clock.install(); await recorderMock(page);
  for (const field of ['name', 'context', 'problem', 'solution']) await page.locator(`#${field}`).fill(`Manual ${field}`);
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
  // A fetch double deliberately resolves even after abort to test the stale-response guard.
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (input, init) => String(input).endsWith('/interpret/audio')
      ? new Promise(resolve => { (window as any).finishAudio = () => resolve(Response.json({ transcript: 'stale', suggestions: { name: 'stale' } })); })
      : original(input, init);
  });
  await page.locator('#audio-file').setInputFiles({ name: 'speech.wav', mimeType: 'audio/wav', buffer: wav() });
  await page.locator('#interpret-audio').click(); await page.locator('#cancel-audio').click();
  await page.evaluate(() => (window as any).finishAudio());
  await expect(page.locator('#transcript')).toBeHidden(); await expect(page.locator('#name')).toHaveValue('Manual name'); await expect(page.locator('#interpret-audio')).toBeDisabled();
  // Normal abort-aware fetch for deterministic client deadline.
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (input, init) => String(input).endsWith('/interpret/audio')
      ? new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('aborted')))) : original(input, init);
  });
  await page.locator('#audio-file').setInputFiles({ name: 'speech.wav', mimeType: 'audio/wav', buffer: wav() });
  await page.locator('#interpret-audio').click(); await page.clock.runFor(140_000);
  await expect(page.locator('#error')).toContainText('timed out'); await expect(page.locator('#record-audio')).toBeEnabled();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click(); await page.locator('#publish-button').click();
  await expect(page.locator('#result-step')).toBeVisible();
});

test('review stops recording and oversized files cannot start requests', async ({ page }) => {
  await recorderMock(page);
  let requests = 0; page.on('request', request => { if (request.url().endsWith('/interpret/audio')) requests++; });
  await page.locator('#audio-file').setInputFiles({ name: 'large.wav', mimeType: 'audio/wav', buffer: Buffer.alloc(16 * 1024 * 1024 + 1) });
  await expect(page.locator('#error')).toContainText('16 MiB'); await expect(page.locator('#interpret-audio')).toBeDisabled();
  for (const field of ['name', 'context', 'problem', 'solution']) await page.locator(`#${field}`).fill(`Manual ${field}`);
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
  await page.locator('#record-audio').click();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await expect(page.locator('#review-step')).toBeVisible();
  expect(await page.evaluate(() => (window as any).audioTest.tracks.every((t: any) => t.readyState === 'ended'))).toBeTruthy();
  await page.locator('#back-button').click(); await expect(page.locator('#interpret-audio')).toBeDisabled();
  expect(requests).toBe(0);
});
