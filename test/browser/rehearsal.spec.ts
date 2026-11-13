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
    : Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'Suggested name', context: 'Suggested context', problem: 'Suggested problem', solution: 'Suggested solution', attributionName: 'Alex Rivera, Sam Chen' }) } }] })) as typeof fetch);
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
    const expectedAttribution = mode === 'photo' && attribution !== 'anonymous' ? 'Alex Rivera, Sam Chen' : 'Table seven';
    if (mode !== 'typed') {
      await page.locator(mode === 'photo' ? '#card-photo' : '#audio-file').setInputFiles({ name: mode === 'photo' ? 'card.png' : 'speech.wav', mimeType: mode === 'photo' ? 'image/png' : 'audio/wav', buffer: mode === 'photo' ? await diagramFixture('marker') : wav() });
      if (mode === 'photo') {
        await expect(page.locator('#photo-status')).toContainText('Fields filled from photo');
        await expect(page.locator('#suggestions')).toBeHidden();
        for (const field of ['name', 'context', 'problem', 'solution']) await expect(page.locator(`#${field}`)).toHaveValue(`Suggested ${field}`);
      } else {
        await page.locator('#interpret-audio').click();
        await expect(page.locator('#suggestions')).toBeVisible();
        await expect(page.locator('#name')).toHaveValue('Authored name');
        await expect(page.locator('#transcript')).toContainText('We pass the pen.');
        await page.getByRole('button', { name: 'Use solution', exact: true }).click();
        await expect(page.locator('#solution')).toHaveValue('Suggested solution');
        await expect(page.locator('#context')).toHaveValue('Authored context');
        await page.getByRole('button', { name: 'Use all', exact: true }).click();
      }
      await page.locator('#name').fill('Reviewed name');
    }
    await page.reload();
    await expect(page.locator('#name')).toHaveValue(mode === 'typed' ? 'Authored name' : 'Reviewed name');
    await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
    await expect(page.locator('#review-name')).toBeFocused();
    await expect(page.locator('#review-attribution')).toHaveText(attribution === 'anonymous' ? 'Anonymous contribution' : `Contributed by ${expectedAttribution}`);
    await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
    await expect(page.locator('#result-step')).toBeVisible();
    expect(published).toHaveLength(1); expect(published[0][1]).toBeUndefined();
    expect(published[0][0].attributionKind).toBe(attribution);
    expect(published[0][0].attributionName).toBe(attribution === 'anonymous' ? undefined : expectedAttribution);
    expect(Object.keys(published[0][0]).sort()).toEqual(['attributionKind', 'attributionName', 'avatarAlt', 'captureId', 'context', 'name', 'problem', 'solution']);
    await expect(page.locator('#pattern-link')).toBeFocused();
  });
}

for (const mode of ['photo', 'audio']) test(`${mode} network failure preserves authored fields and manual publication`, async ({ page }) => {
  await page.route(`**/api/interpret/${mode}`, route => route.abort());
  await page.locator(mode === 'photo' ? '#card-photo' : '#audio-file').setInputFiles({ name: 'temporary', mimeType: mode === 'photo' ? 'image/png' : 'audio/webm', buffer: Buffer.from('temporary bytes') });
  if (mode === 'audio') await page.locator('#interpret-audio').click();
  await expect(page.locator('#error')).toBeVisible();
  for (const field of ['name', 'context', 'problem', 'solution']) await expect(page.locator(`#${field}`)).toHaveValue(`Authored ${field}`);
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible(); expect(published).toHaveLength(1);
});

for (const attribution of ['group', 'individual']) test(`photo contributor names reach ${attribution} review and publication`, async ({ page }) => {
  await page.locator(`[name=attributionKind][value=${attribution}]`).check();
  // Exercise the real browser -> API -> OpenRouter schema/filter path.
  await page.locator('#card-photo').setInputFiles({ name: 'card.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
  await expect(page.locator('#photo-status')).toContainText('Fields filled from photo');
  await expect(page.locator('#attributionName')).toHaveValue('Alex Rivera, Sam Chen');
  await page.reload();
  await expect(page.locator('#attributionName')).toHaveValue('Alex Rivera, Sam Chen');
  await expect(page.locator(`[name=attributionKind][value=${attribution}]`)).toBeChecked();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await expect(page.locator('#review-attribution')).toHaveText('Contributed by Alex Rivera, Sam Chen');
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible();
  expect(published[0][0].attributionName).toBe('Alex Rivera, Sam Chen');
  expect(published[0][0].attributionKind).toBe(attribution);
});

for (const selection of ['anonymous before reading', 'anonymous while reading', 'individual while reading']) {
  test(`photo contributor names respect ${selection}`, async ({ page }) => {
    if (selection === 'anonymous before reading') await page.locator('[name=attributionKind][value=anonymous]').check();
    let finish: (() => void) | undefined;
    await page.route('**/api/interpret/photo', async route => {
      await new Promise<void>(resolve => { finish = resolve; });
      await route.fulfill({ json: { suggestions: { name: 'From photo', attributionName: 'Alex Rivera, Sam Chen' } } });
    });
    await page.locator('#card-photo').setInputFiles({ name: 'card.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
    await expect.poll(() => !!finish).toBeTruthy();
    if (selection !== 'anonymous before reading') {
      await page.locator(`[name=attributionKind][value=${selection.startsWith('anonymous') ? 'anonymous' : 'individual'}]`).check();
    }
    finish!();
    await expect(page.locator('#name')).toHaveValue('From photo');
    await expect(page.locator('#attributionName')).toHaveValue('');
    if (selection.startsWith('anonymous')) {
      await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
      await expect(page.locator('#review-attribution')).toHaveText('Anonymous contribution');
      await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
      await expect(page.locator('#result-step')).toBeVisible();
      expect(published[0][0].attributionName).toBeUndefined();
      expect(published[0][0].attributionKind).toBe('anonymous');
    }
  });
}

test('photo fills only returned fields and keeps edits made while processing', async ({ page }) => {
  let finish: (() => void) | undefined;
  await page.route('**/api/interpret/photo', async route => {
    await new Promise<void>(resolve => { finish = resolve; });
    await route.fulfill({ json: { suggestions: { name: 'From photo', context: 'Old context', attributionName: 'Alex Rivera, Sam Chen', attributionKind: 'anonymous' } } });
  });
  await page.locator('#card-photo').setInputFiles({ name: 'card.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
  await expect(page.locator('#photo-status')).toContainText('Reading photo');
  await page.locator('#context').fill('Edited while reading');
  await page.locator('#attributionName').fill('Edited contributor');
  await expect.poll(() => !!finish).toBeTruthy();
  finish!();
  await expect(page.locator('#name')).toHaveValue('From photo');
  await expect(page.locator('#context')).toHaveValue('Edited while reading');
  await expect(page.locator('#problem')).toHaveValue('Authored problem');
  await expect(page.locator('#attributionName')).toHaveValue('Edited contributor');
  await expect(page.locator('[name=attributionKind][value=group]')).toBeChecked();
  await expect(page.locator('#suggestions')).toBeHidden();
  await page.reload();
  await expect(page.locator('#name')).toHaveValue('From photo');
  await expect(page.locator('#context')).toHaveValue('Edited while reading');
  await expect(page.locator('#attributionName')).toHaveValue('Edited contributor');
});

test('a later photo supersedes a pending photo result', async ({ page }) => {
  await page.evaluate(() => {
    const original = window.fetch;
    let first = true;
    window.fetch = (input, init) => {
      if (String(input).endsWith('/interpret/photo') && first) {
        first = false;
        return new Promise(resolve => { (window as any).finishFirstPhoto = () => resolve(Response.json({ suggestions: { name: 'Stale photo', attributionName: 'Stale contributor' } })); });
      }
      return original(input, init);
    };
  });
  await page.locator('#card-photo').setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
  await page.locator('#card-photo').setInputFiles({ name: 'second.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
  await expect(page.locator('#name')).toHaveValue('Suggested name');
  await page.evaluate(() => (window as any).finishFirstPhoto());
  await expect(page.locator('#name')).toHaveValue('Suggested name');
  await expect(page.locator('#attributionName')).toHaveValue('Alex Rivera, Sam Chen');
});

test('photo inputs allow selecting an existing picture', async ({ page }) => {
  await expect(page.locator('#card-photo')).not.toHaveAttribute('capture');
  await expect(page.locator('#avatar')).not.toHaveAttribute('capture');
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
