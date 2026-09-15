import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import type { AddressInfo } from 'node:net';
import { DraftBoard } from '../../src/drafts.js';
import { createApp } from '../../src/app.js';

test('two browsers stream names, clear names, recover network updates and distinguish Git from Pages', async ({ browser }) => {
  let live = false;
  const board = new DraftBoard(async () => live);
  const server = createApp({ async publish() { return { slug: 'a', publicUrl: 'https://handbook.test/a/', commitUrl: 'commit' }; } }, board, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const capture = await browser.newPage(), dashboard = await browser.newPage();
  try {
    await dashboard.goto(`${base}/dashboard.html`); await capture.goto(base);
    await capture.locator('#name').fill('Live provisional');
    await expect(dashboard.getByRole('heading', { name: 'Live provisional' })).toBeVisible();
    await capture.locator('#name').fill(''); await expect(dashboard.getByRole('heading', { name: 'Untitled pattern' })).toBeVisible();
    await capture.context().setOffline(true); await capture.locator('#name').fill('Newest name');
    await capture.context().setOffline(false);
    await expect(dashboard.getByRole('heading', { name: 'Newest name' })).toBeVisible();
    for (const field of ['context', 'problem', 'solution']) await capture.locator(`#${field}`).fill('PRIVATE text');
    await capture.getByRole('radio', { name: 'Anonymous', exact: true }).check();
    await capture.getByRole('button', { name: 'Review pattern', exact: true }).click();
    await capture.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
    await expect(dashboard.locator('.status')).toHaveText('Saved · waiting for Pages');
    await expect(dashboard.locator('#board a')).toHaveCount(0);
    await board.checkPages(); await expect(dashboard.locator('.status')).toHaveText('Saved · waiting for Pages');
    live = true; await board.checkPages(); await expect(dashboard.locator('#board a')).toHaveAttribute('href', 'https://handbook.test/a/');
    await expect(dashboard.locator('#board')).not.toContainText('PRIVATE');
  } finally { await capture.close(); await dashboard.close(); board.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('100 patterns have readable projection pages, mobile fallback, stable focus and full reconnect snapshot', async ({ page, context }, testInfo) => {
  const board = new DraftBoard();
  for (let i = 0; i < 100; i++) {
    const draft = board.create()!;
    board.update(draft.id, { name: `${i + 1}. A readable workshop pattern name`, stage: 'published', publicUrl: `https://handbook.test/${i}/` });
  }
  const server = createApp({ async publish() { throw new Error('unused'); } }, board, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await page.setViewportSize({ width: 1920, height: 1080 }); await page.goto(`${base}/dashboard.html`);
    await expect(page.locator('.status-card')).toHaveCount(12);
    await expect(page.locator('#board-summary')).toHaveText('100 patterns · 100 published');
    expect(await page.locator('.status-card').last().evaluate(el => el.getBoundingClientRect().bottom < innerHeight)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('projection.png') });
    await page.locator('#board a').first().focus();
    const draft = board.create()!; board.update(draft.id, { name: 'Live extra' });
    await expect(page.locator('#board-summary')).toContainText('101 patterns');
    await expect(page.locator('#board a').first()).toBeFocused();
    for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: '100. A readable workshop pattern name', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await context.setOffline(true); server.closeAllConnections(); await expect(page.getByRole('status')).toContainText('Reconnecting');
    board.update(draft.id, { name: '<img src=x onerror=alert(1)>' });
    await context.setOffline(false);
    await expect(page.getByRole('heading', { name: '<img src=x onerror=alert(1)>', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#board img')).toHaveCount(0);
  } finally { board.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('name sync serializes edits and recreates a missing room entry with the saved capture ID', async ({ page }) => {
  const board = new DraftBoard();
  const server = createApp({ async publish() { throw new Error('unused'); } }, board, undefined, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  let release!: () => void;
  try {
    await page.goto(base);
    await expect.poll(() => board.all().length).toBe(1);
    const id = board.all()[0].id;
    let intercepted = false;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/drafts/*', async route => {
      if (route.request().method() === 'PATCH' && route.request().postDataJSON().name === 'Older name') {
        intercepted = true; await gate;
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      } else await route.continue();
    });
    await page.locator('#name').fill('Older name');
    await expect.poll(() => intercepted).toBe(true);
    await page.locator('#name').fill('Newest reviewed name');
    release();
    await expect.poll(() => board.all()[0].name).toBe('Newest reviewed name');
    expect(board.all()).toHaveLength(1);
    expect(board.all()[0].id).toBe(id);
    await page.reload(); await expect(page.locator('#name')).toHaveValue('Newest reviewed name');
    expect(board.all()[0].id).toBe(id);
  } finally { release?.(); board.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
