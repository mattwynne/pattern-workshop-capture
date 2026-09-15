import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizeAvatar } from "../src/image.js";

test("normalizes avatars to bounded metadata-free WebP", async () => {
  const source = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "#f4c542" },
  }).jpeg().withExif({ IFD0: { Artist: "Workshop participant" }, IFD3: { GPSLatitudeRef: "N" } }).toBuffer();

  const avatar = await normalizeAvatar(source, "image/jpeg");
  const metadata = await sharp(avatar.bytes).metadata();
  assert.equal(avatar.extension, "webp");
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 2000);
  assert.equal(metadata.exif, undefined);
});

test("rejects unsupported media", async () => {
  await assert.rejects(() => normalizeAvatar(Buffer.from("hello"), "text/plain"), /Choose a JPEG/);
});

import { avatarPreviews } from "../src/image.js";
import { diagramFixture } from "./diagram-fixtures.js";

for (const kind of ['pencil', 'marker', 'lined', 'shadow', 'skew']) {
  test(`${kind}: deterministic cleanup retains geometry, colour and faint edge marks`, async () => {
    const source = await diagramFixture(kind);
    const first = await avatarPreviews(source, 'image/png');
    const second = await avatarPreviews(source, 'image/png');
    assert.deepEqual(first, second);
    assert.ok(first.cleaned);
    const before = await sharp(first.original.bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const after = await sharp(first.cleaned.bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual(before.info, after.info);
    let maxDifference = 0;
    for (let i = 0; i < before.data.length; i++) maxDifference = Math.max(maxDifference, Math.abs(before.data[i] - after.data[i]));
    assert.ok(maxDifference <= 5, `colour/contrast shift was ${maxDifference}`);
    // Pencil/marker mark at the outer edge must survive, not be trimmed as paper.
    if (kind !== 'skew') {
      const intensity = (x: number, y: number) => after.data[(y * 320 + x) * 3];
      assert.ok(intensity(15, 20) < intensity(15, 30) - 20);
    }
    for (const output of [first.original, first.cleaned]) {
      const metadata = await sharp(output.bytes).metadata();
      assert.equal(metadata.exif, undefined); assert.equal(metadata.xmp, undefined); assert.equal(metadata.icc, undefined);
      const republished = await normalizeAvatar(output.bytes, output.contentType);
      assert.deepEqual(republished.bytes, output.bytes, 'published bytes match selected preview exactly');
    }
  });
}

test('orientation is corrected and both choices strip EXIF/GPS', async () => {
  const source = await sharp(await diagramFixture('marker')).jpeg().withMetadata({ orientation: 6 })
    .withExifMerge({ IFD0: { Artist: 'Private name' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 30/1 0/1' } }).toBuffer();
  assert.ok((await sharp(source).metadata()).exif);
  const previews = await avatarPreviews(source, 'image/jpeg');
  for (const output of [previews.original, previews.cleaned!]) {
    const metadata = await sharp(output.bytes).metadata();
    assert.equal(metadata.width, 240); assert.equal(metadata.height, 320);
    assert.equal(metadata.exif, undefined); assert.equal(metadata.orientation, undefined);
  }
});

test('cleanup failure returns a publishable original; invalid originals still fail', async () => {
  const previews = await avatarPreviews(await diagramFixture('pencil'), 'image/png', async () => { throw new Error('processing failed'); });
  assert.equal(previews.cleaned, undefined); assert.match(previews.warning!, /still publish/);
  assert.ok((await normalizeAvatar(previews.original.bytes, 'image/webp')).bytes.length);
  await assert.rejects(avatarPreviews(Buffer.from('broken'), 'image/png'), /could not be read/);
});

test('rejects a different image format disguised as an allowed upload', async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
  await assert.rejects(normalizeAvatar(svg, 'image/png'), /could not be read/);
});
