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
