import { test, expect } from '@playwright/test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app.js';
import type { PatternPublisher } from '../../src/github.js';
import { diagramFixture } from '../diagram-fixtures.js';

let server: Server, base: string;
let published: Parameters<PatternPublisher['publish']>[] = [];
test.beforeAll(async () => {
  server = createApp({ async publish(...args) {
    published.push(args);
    return { slug: 'drawing', publicUrl: 'https://handbook.test/drawing', commitUrl: 'https://github.test/commit' };
  } }).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ page }) => {
  published = [];
  await page.goto(base);
  for (const field of ['name', 'context', 'problem', 'solution']) await page.locator(`#${field}`).fill(`Our ${field}`);
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
});

for (const selection of ['Original', 'Gently cleaned']) {
  test(`mobile comparison publishes exactly the reviewed ${selection} with alt text`, async ({ page }) => {
    const responsePromise = page.waitForResponse('**/api/avatars/previews');
    await page.locator('#avatar').setInputFiles({ name: 'drawing.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
    const previews = await (await responsePromise).json();
    await expect(page.locator('#avatar-cleaned-choice')).toBeEnabled();
    await expect(page.locator('#avatar-original-choice')).toBeChecked();
    const originalBox = await page.locator('#avatar-preview').boundingBox();
    const cleanedBox = await page.locator('#avatar-cleaned').boundingBox();
    expect(cleanedBox!.y).toBeGreaterThan(originalBox!.y + originalBox!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole('radio', { name: selection, exact: true }).check();
    await page.locator('#avatarAlt').fill('Our boxes connected by a hand-drawn arrow');
    await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
    await expect(page.locator('#review-avatar')).toHaveAttribute('alt', 'Our boxes connected by a hand-drawn arrow');
    const expected = previews[selection === 'Original' ? 'original' : 'cleaned'];
    const reviewed = await page.locator('#review-avatar').evaluate(async (image: HTMLImageElement) => {
      const bytes = new Uint8Array(await (await fetch(image.src)).arrayBuffer());
      return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
    });
    expect(reviewed).toBe(expected.split(',')[1]);
    await page.getByRole('button', { name: '← Keep editing', exact: true }).click();
    await expect(page.getByRole('radio', { name: selection, exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
    await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
    await expect(page.locator('#result-step')).toBeVisible();
    expect(published).toHaveLength(1);
    expect(published[0][1]!.bytes.toString('base64')).toBe(reviewed);
    expect(published[0][0].avatarAlt).toBe('Our boxes connected by a hand-drawn arrow');
    expect(await page.evaluate(() => localStorage.getItem('pattern-workshop-draft'))).toBeNull();
  });
}

test('network preview failure permits original publication', async ({ page }) => {
  await page.route('**/api/avatars/previews', route => route.abort());
  await page.locator('#avatar').setInputFiles({ name: 'pencil.png', mimeType: 'image/png', buffer: await diagramFixture('pencil') });
  await expect(page.locator('#avatar-status')).toContainText('Preview unavailable');
  await expect(page.locator('#avatar-cleaned-choice')).toBeDisabled();
  await page.locator('#avatarAlt').fill('Faint pencil boxes');
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible();
  expect(published).toHaveLength(1);
});

test('cleanup failure, replacement, and removal cannot reuse an old selection', async ({ page }) => {
  await page.locator('#avatar').setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });
  await expect(page.locator('#avatar-cleaned-choice')).toBeEnabled();
  await page.locator('#avatar-cleaned-choice').check();
  await page.route('**/api/avatars/previews', async route => {
    const response = await route.fetch(); const body = await response.json();
    delete body.cleaned; body.warning = 'Cleanup was unavailable. You can still publish the original.';
    await route.fulfill({ json: body });
  });
  await page.locator('#avatar').setInputFiles({ name: 'second.png', mimeType: 'image/png', buffer: await diagramFixture('pencil') });
  await expect(page.locator('#avatar-status')).toContainText('Cleanup was unavailable');
  await expect(page.locator('#avatar-original-choice')).toBeChecked();
  await expect(page.locator('#avatar-cleaned-choice')).toBeDisabled();
  await page.getByRole('button', { name: 'Remove picture', exact: true }).click();
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await expect(page.locator('#review-avatar')).toBeHidden();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible();
  expect(published[0][1]).toBeUndefined(); expect(published[0][0].avatarAlt).toBeUndefined();
});

test('late preview cannot restore removed media, and publication failure keeps selection for retry', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/avatars/previews', async route => {
    const response = await route.fetch(); await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.locator('#avatar').setInputFiles({ name: 'drawing.png', mimeType: 'image/png', buffer: await diagramFixture('lined') });
  await expect(page.locator('#avatar-status')).toContainText('Preparing');
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await expect(page.locator('#error')).toContainText('still being prepared');
  await page.getByRole('button', { name: 'Remove picture', exact: true }).click(); release();
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await page.unroute('**/api/avatars/previews');
  await page.locator('#avatar').setInputFiles({ name: 'drawing.png', mimeType: 'image/png', buffer: await diagramFixture('shadow') });
  await expect(page.locator('#avatar-cleaned-choice')).toBeEnabled();
  await page.locator('#avatar-cleaned-choice').check(); await page.locator('#avatarAlt').fill('Shadowed drawing');
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.route('**/api/patterns', route => route.fulfill({ status: 502, json: { error: 'Publication failed' } }), { times: 1 });
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#error')).toContainText('Publication failed');
  await expect(page.locator('#review-avatar')).toBeVisible();
  await page.getByRole('button', { name: 'Try publishing again', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible(); expect(published).toHaveLength(1);
});

test('malformed image shows the server error and cannot leak into publication', async ({ page }) => {
  await page.locator('#avatar').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('#avatar-status')).toContainText('could not be read');
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible(); expect(published[0][1]).toBeUndefined();
});
