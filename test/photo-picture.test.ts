import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { OpenRouter } from '../src/openrouter.js';
import { cropPhotoPicture, normalizeAvatar } from '../src/image.js';
import { diagramFixture } from './diagram-fixtures.js';

const picture = { x: 0.25, y: 0.25, width: 0.5, height: 0.5, alt: 'Two boxes and an arrow' };

test('picture crop uses oriented source pixels and strips private metadata', async () => {
  const source = await sharp(await diagramFixture('marker')).jpeg().withMetadata({ orientation: 6 })
    .withExifMerge({ IFD0: { Artist: 'Private contributor' } }).toBuffer();
  const cropped = await cropPhotoPicture(source, picture);
  const oriented = await sharp(source).rotate().png().toBuffer();
  const expected = await sharp(oriented).extract({ left: 60, top: 80, width: 120, height: 160 }).raw().toBuffer();
  assert.deepEqual(await sharp(cropped.bytes).raw().toBuffer(), expected);
  const metadata = await sharp(cropped.bytes).metadata();
  assert.equal(metadata.width, 120); assert.equal(metadata.height, 160);
  assert.equal(metadata.exif, undefined); assert.equal(metadata.orientation, undefined);
  for (const bad of [{ x: -1 }, { width: 0 }, { width: Infinity }, { height: 1 }]) {
    await assert.rejects(cropPhotoPicture(source, { ...picture, ...bad }), /Invalid picture bounds/);
  }
});

for (const mode of ['drawing', 'no drawing', 'invalid bounds', 'cleanup failure', 'crop failure']) {
  test(`card photo API: ${mode}`, async () => {
    const ai = new OpenRouter('secret', undefined, undefined, undefined, (async () =>
      Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'Take turns', picture: mode === 'no drawing' ? null : mode === 'invalid bounds' ? { ...picture, x: 2 } : picture }) } }] })) as typeof fetch);
    // A malformed region simulates a crop failure after successful text interpretation.
    if (mode === 'crop failure') ai.interpretPhoto = async () => ({ name: 'Take turns', picture: { ...picture, width: 2 } });
    const server = createApp({ async publish() { throw new Error('Must not publish during interpretation'); } }, undefined, ai,
      mode === 'cleanup failure' ? async () => { throw new Error('Cleanup unavailable'); } : undefined, () => {}).listen(0);
    await new Promise<void>(resolve => server.once('listening', resolve));
    try {
      const body = new FormData();
      body.set('photo', new Blob([new Uint8Array(await diagramFixture('marker'))], { type: 'image/png' }), 'card.png');
      const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/interpret/photo`, { method: 'POST', body });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const result = await response.json() as any;
      assert.deepEqual(result.suggestions, { name: 'Take turns' });
      if (['no drawing', 'invalid bounds', 'crop failure'].includes(mode)) {
        assert.equal(result.avatar, undefined);
        if (mode === 'crop failure') assert.match(result.warning, /fields are ready/);
      } else {
        assert.equal(result.avatar.alt, picture.alt);
        const bytes = Buffer.from(result.avatar.original.split(',')[1], 'base64');
        const metadata = await sharp(bytes).metadata();
        assert.equal(metadata.width, 160); assert.equal(metadata.height, 120);
        assert.equal(metadata.exif, undefined);
        assert.deepEqual((await normalizeAvatar(bytes, 'image/webp')).bytes, bytes);
        if (mode === 'cleanup failure') {
          assert.equal(result.avatar.cleaned, undefined);
          assert.match(result.avatar.warning, /still publish/);
        } else assert.match(result.avatar.cleaned, /^data:image\/webp;base64,/);
      }
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
}
