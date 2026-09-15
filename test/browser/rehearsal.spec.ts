import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app.js';
import { OpenRouter } from '../../src/openrouter.js';
import { DraftBoard } from '../../src/drafts.js';
import type { PatternPublisher } from '../../src/github.js';
import { wav } from '../audio-fixtures.js';
import { diagramFixture } from '../diagram-fixtures.js';

let server: Server, base: string, board: DraftBoard;
let published: Parameters<PatternPublisher['publish']>[] = [];
test.beforeAll(async () => {
  board = new DraftBoard();
  // Real browser -> multipart API -> OpenRouter adapter; only the external provider is replaced.
  const ai = new OpenRouter('test', undefined, undefined, undefined, (async url => String(url).includes('/transcriptions')
    ? Response.json({ text: 'We pass the pen.' })
    : Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'Suggested name', context: 'Suggested context', problem: 'Suggested problem', solution: 'Suggested solution' }) } }] })) as typeof fetch);
  server = createApp({ async publish(...args) { published.push(args); return { slug: 'practice', publicUrl: 'https://handbook.test/patterns/practice/', commitUrl: 'https://github.test/commit' }; } }, board, ai, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ page }) => {
  published = []; await page.goto(base);
  for (const field of ['name', 'context', 'problem', 'solution']) await page.locator(`#${field}`).fill(`Authored ${field}`);
});

for (const mode of ['typed', 'photo', 'audio']) for (const attribution of ['group', 'individual', 'anonymous']) {
  test(`${mode} capture with ${attribution} attribution survives reload, review and publication`, async ({ page }) => {
    await page.locator(`[name=attributionKind][value=${attribution}]`).check();
    if (attribution !== 'anonymous') await page.locator('#attributionName').fill('Table seven');
    if (mode !== 'typed') {
      await page.locator(mode === 'photo' ? '#card-photo' : '#audio-file').setInputFiles({ name: mode === 'photo' ? 'card.png' : 'speech.wav', mimeType: mode === 'photo' ? 'image/png' : 'audio/wav', buffer: mode === 'photo' ? await diagramFixture('marker') : wav() });
      await page.locator(`#interpret-${mode}`).click();
      await expect(page.locator('#suggestions')).toBeVisible();
      await expect(page.locator('#name')).toHaveValue('Authored name');
      if (mode === 'audio') await expect(page.locator('#transcript')).toContainText('We pass the pen.');
      await page.getByRole('button', { name: 'Use solution', exact: true }).click();
      await expect(page.locator('#solution')).toHaveValue('Suggested solution');
      await expect(page.locator('#context')).toHaveValue('Authored context');
      await page.getByRole('button', { name: 'Use all', exact: true }).click();
      await page.locator('#name').fill('Reviewed name');
    }
    await page.reload();
    await expect(page.locator('#name')).toHaveValue(mode === 'typed' ? 'Authored name' : 'Reviewed name');
    await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
    await expect(page.locator('#review-name')).toBeFocused();
    await expect(page.locator('#review-attribution')).toHaveText(attribution === 'anonymous' ? 'Anonymous contribution' : 'Contributed by Table seven');
    await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
    await expect(page.locator('#result-step')).toBeVisible();
    expect(published).toHaveLength(1); expect(published[0][1]).toBeUndefined();
    expect(published[0][0].attributionKind).toBe(attribution);
    expect(published[0][0].attributionName).toBe(attribution === 'anonymous' ? undefined : 'Table seven');
    expect(Object.keys(published[0][0]).sort()).toEqual(['attributionKind', 'attributionName', 'avatarAlt', 'captureId', 'context', 'name', 'problem', 'solution']);
    await expect(page.locator('#pattern-link')).toBeFocused();
  });
}

for (const mode of ['photo', 'audio']) test(`${mode} network failure preserves authored fields and manual publication`, async ({ page }) => {
  await page.route(`**/api/interpret/${mode}`, route => route.abort());
  await page.locator(mode === 'photo' ? '#card-photo' : '#audio-file').setInputFiles({ name: 'temporary', mimeType: mode === 'photo' ? 'image/png' : 'audio/webm', buffer: Buffer.from('temporary bytes') });
  await page.locator(`#interpret-${mode}`).click(); await expect(page.locator('#error')).toBeVisible();
  for (const field of ['name', 'context', 'problem', 'solution']) await expect(page.locator(`#${field}`)).toHaveValue(`Authored ${field}`);
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible(); expect(published).toHaveLength(1);
});

test('microphone denial offers file fallback without changing text', async ({ page }) => {
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
  await page.locator('#record-audio').click(); await expect(page.locator('#error')).toContainText('choose an audio file');
  await expect(page.locator('#context')).toHaveValue('Authored context');
});

test('320px capture, review, result and dashboard pass automated accessibility and overflow checks', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const audit = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  };
  await audit();
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
  await page.locator('#name').fill('VeryLongName'.repeat(10));
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click(); await audit();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click(); await expect(page.locator('#result-step')).toBeVisible(); await audit();
  await page.goto(`${base}/dashboard.html`); await expect(page.locator('.status-card').first()).toBeVisible(); await audit();
});

test('dashboard reconnects to full state and renders hostile titles as text', async ({ page, context }) => {
  await page.goto(`${base}/dashboard.html`);
  await expect(page.getByRole('status')).toHaveText('Live from the room');
  await context.setOffline(true); server.closeAllConnections(); await expect(page.getByRole('status')).toContainText('Reconnecting');
  const draft = board.create()!; board.update(draft.id, { name: '<img src=x onerror=alert(1)>', stage: 'published', publicUrl: 'https://handbook.test/patterns/new/' });
  await context.setOffline(false);
  await expect(page.getByRole('status')).toHaveText('Live from the room', { timeout: 15000 });
  while (await page.locator('#next-page').isEnabled()) await page.locator('#next-page').click();
  await expect(page.getByRole('heading', { name: '<img src=x onerror=alert(1)>', exact: true })).toBeVisible();
  expect(await page.locator('#board img').count()).toBe(0);
  await expect(page.getByRole('status')).toHaveText('Live from the room');
});

test('browser MediaRecorder captures synthetic audio, stops tracks and offers suggestions', async ({ page }) => {
  await page.evaluate(() => {
    const audio = new AudioContext(); const oscillator = audio.createOscillator();
    const destination = audio.createMediaStreamDestination(); oscillator.connect(destination); oscillator.start();
    (window as any).rehearsalStream = destination.stream;
    navigator.mediaDevices.getUserMedia = async () => destination.stream;
  });
  await page.locator('#record-audio').click(); await expect(page.locator('#recording-time')).toContainText('Recording');
  await page.waitForTimeout(300); // Let the real encoder produce an audio packet.
  await page.getByRole('button', { name: '■ Stop recording', exact: true }).click();
  await expect(page.locator('#recording-time')).toContainText('Recorded');
  expect(await page.evaluate(() => (window as any).rehearsalStream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended'))).toBeTruthy();
  await page.locator('#interpret-audio').click(); await expect(page.locator('#transcript')).toContainText('We pass the pen.');
  await expect(page.locator('#solution')).toHaveValue('Authored solution');
});
