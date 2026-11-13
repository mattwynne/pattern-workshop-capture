import { test, expect } from '@playwright/test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app.js';
import { OpenRouter } from '../../src/openrouter.js';
import type { PatternPublisher } from '../../src/github.js';
import { diagramFixture } from '../diagram-fixtures.js';

let server: Server, base: string;
let picture: unknown;
let published: Parameters<PatternPublisher['publish']>[] = [];
const region = { x: 0.25, y: 0.25, width: 0.5, height: 0.5, alt: 'Boxes connected by an arrow' };
const photo = async () => ({ name: 'card.png', mimeType: 'image/png', buffer: await diagramFixture('marker') });

test.beforeAll(async () => {
  const ai = new OpenRouter('test', undefined, undefined, undefined, (async () => Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'From card', context: 'Mapping', problem: 'Dominance', solution: 'Take turns', picture }) } }] })) as typeof fetch);
  server = createApp({ async publish(...args) {
    published.push(args);
    return { slug: 'drawing', publicUrl: 'https://handbook.test/drawing', commitUrl: 'https://github.test/commit' };
  } }, undefined, ai, undefined, () => {}).listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ page }) => {
  picture = region; published = [];
  await page.goto(base);
  for (const field of ['name', 'context', 'problem', 'solution']) await page.locator(`#${field}`).fill(`Our ${field}`);
  await page.getByRole('radio', { name: 'Anonymous', exact: true }).check();
});

for (const input of ['card-photo-camera', 'card-photo']) for (const choice of ['Original', 'Gently cleaned']) {
  test(`${input} fills a cropped picture and publishes the reviewed ${choice}`, async ({ page }) => {
    const responsePromise = page.waitForResponse('**/api/interpret/photo');
    await page.locator(`#${input}`).setInputFiles(await photo());
    const result = await (await responsePromise).json();
    await expect(page.locator('#photo-status')).toContainText('Picture filled too');
    await expect(page.locator('#avatarAlt')).toHaveValue(region.alt);
    await expect(page.locator('#avatar-original-choice')).toBeChecked();
    await expect(page.locator('#avatar-preview')).toHaveJSProperty('naturalWidth', 160);
    await expect(page.locator('#avatar-preview')).toHaveJSProperty('naturalHeight', 120);
    await page.getByRole('radio', { name: choice, exact: true }).check();
    await page.locator('#avatarAlt').fill('Our reviewed drawing');
    const stored = await page.evaluate(() => localStorage.getItem('pattern-workshop-draft'));
    expect(stored).not.toContain('data:image'); expect(stored).not.toContain('blob:');
    await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
    await expect(page.locator('#review-avatar')).toBeVisible();
    await expect(page.locator('#review-avatar')).toHaveAttribute('alt', 'Our reviewed drawing');
    const reviewed = await page.locator('#review-avatar').evaluate(async (image: HTMLImageElement) => {
      const bytes = new Uint8Array(await (await fetch(image.src)).arrayBuffer());
      return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
    });
    expect(reviewed).toBe(result.avatar[choice === 'Original' ? 'original' : 'cleaned'].split(',')[1]);
    await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
    await expect(page.locator('#result-step')).toBeVisible();
    expect(published[0][1]!.bytes.toString('base64')).toBe(reviewed);
    expect(published[0][0].avatarAlt).toBe('Our reviewed drawing');
  });
}

for (const invalid of [null, { ...region, x: 4 }]) test(`no usable drawing leaves the picture optional: ${JSON.stringify(invalid)}`, async ({ page }) => {
  picture = invalid;
  await page.locator('#card-photo-camera').setInputFiles(await photo());
  await expect(page.locator('#photo-status')).toContainText('Fields filled from photo');
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible();
  expect(published[0][1]).toBeUndefined();
});

for (const action of ['choose picture', 'remove picture', 'edit description', 'review']) test(`late card extraction respects ${action}`, async ({ page }) => {
  let finish!: () => void;
  await page.route('**/api/interpret/photo', async route => {
    const response = await route.fetch();
    await new Promise<void>(resolve => { finish = resolve; });
    await route.fulfill({ response }).catch(() => {});
  });
  await page.locator('#card-photo-camera').setInputFiles(await photo());
  await expect.poll(() => !!finish).toBeTruthy();
  let chosen: string | null = null;
  if (action === 'choose picture') {
    await page.locator('#avatar').setInputFiles(await photo());
    await expect(page.locator('#avatar-cleaned-choice')).toBeEnabled();
    await page.locator('#avatarAlt').fill('My separate picture');
    chosen = await page.locator('#avatar-preview').getAttribute('src');
  } else if (action === 'remove picture') {
    await page.getByRole('button', { name: 'Remove picture', exact: true }).click();
  } else if (action === 'edit description') {
    // Text restored from a previous draft remains editable while processing.
    await page.locator('#avatarAlt').evaluate((input: HTMLInputElement) => { input.value = 'My edited description'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  } else {
    await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  }
  finish();
  if (action === 'review') {
    await expect(page.locator('#review-avatar')).toBeHidden();
    await expect(page.locator('#avatar-comparison')).toBeHidden();
  } else {
    await expect(page.locator('#photo-status')).toContainText('Fields filled from photo');
    if (action === 'choose picture') {
      await expect(page.locator('#avatar-preview')).toHaveAttribute('src', chosen!);
      await expect(page.locator('#avatarAlt')).toHaveValue('My separate picture');
    } else if (action === 'remove picture') {
      await expect(page.locator('#avatar-comparison')).toBeHidden();
    } else {
      await expect(page.locator('#avatar-comparison')).toBeVisible();
      await expect(page.locator('#avatarAlt')).toHaveValue('My edited description');
    }
  }
});

test('an old photo cannot add its drawing after a newer photo without one', async ({ page }) => {
  // Deliberately ignore abort on the first request to exercise the version guard.
  await page.evaluate(() => {
    const original = window.fetch;
    let first = true;
    window.fetch = (input, init) => {
      if (String(input).endsWith('/interpret/photo') && first) {
        first = false;
        return new Promise(resolve => {
          (window as any).finishOldPhoto = () => resolve(Response.json({
            suggestions: { name: 'Old card' },
            avatar: { original: 'data:image/webp;base64,UklGRg==', alt: 'Old drawing' },
          }));
        });
      }
      return original(input, init);
    };
  });
  await page.locator('#card-photo-camera').setInputFiles(await photo());
  picture = null;
  await page.locator('#card-photo').setInputFiles(await photo());
  await expect(page.locator('#photo-status')).toContainText('Fields filled from photo');
  await page.evaluate(() => (window as any).finishOldPhoto());
  await expect(page.locator('#name')).toHaveValue('From card');
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await expect(page.locator('#avatarAlt')).toHaveValue('');
});

test('reloading discards an extracted picture but retains its text fields', async ({ page }) => {
  await page.locator('#card-photo-camera').setInputFiles(await photo());
  await expect(page.locator('#photo-status')).toContainText('Picture filled too');
  await page.reload();
  await expect(page.locator('#name')).toHaveValue('From card');
  await expect(page.locator('#avatar-comparison')).toBeHidden();
});

test('extracted picture can be removed and is never restored by a reload', async ({ page }) => {
  await page.locator('#card-photo-camera').setInputFiles(await photo());
  await expect(page.locator('#photo-status')).toContainText('Picture filled too');
  await page.getByRole('button', { name: 'Remove picture', exact: true }).click();
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await page.reload();
  await expect(page.locator('#name')).toHaveValue('From card');
  await expect(page.locator('#avatar-comparison')).toBeHidden();
  await page.getByRole('button', { name: 'Review pattern', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to handbook', exact: true }).click();
  await expect(page.locator('#result-step')).toBeVisible();
  expect(published[0][1]).toBeUndefined();
});
