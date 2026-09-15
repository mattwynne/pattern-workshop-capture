import sharp from "sharp";

export interface PublicAvatar {
  bytes: Buffer;
  extension: "webp";
  contentType: "image/webp";
}
export interface AvatarPreviews {
  original: PublicAvatar;
  cleaned?: PublicAvatar;
  warning?: string;
}
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const avatar = (bytes: Buffer): PublicAvatar => ({ bytes, extension: "webp", contentType: "image/webp" });

export async function normalizeAvatar(bytes: Buffer, contentType: string): Promise<PublicAvatar> {
  if (!allowedTypes.has(contentType)) throw new Error("Choose a JPEG, PNG, WebP, or HEIC image");
  try {
    // Sharp strips metadata by default. Lossless output also prevents a second
    // publication-time normalization from degrading the participant's preview.
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp', 'heif'].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      throw new Error("Unsupported or animated image");
    }
    return avatar(await image
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ lossless: true }).toBuffer());
  } catch {
    throw new Error("Choose another image; that image could not be read");
  }
}

export async function cleanAvatar(original: PublicAvatar): Promise<PublicAvatar> {
  // Keep the entire frame: uncertain paper edges or line angles must never
  // cause cropping/deskewing to erase marks. No thresholding or sharpening.
  // A small lift reduces grey paper/shadows while retaining faint strokes and colour.
  return avatar(await sharp(original.bytes)
    .flatten({ background: "#ffffff" })
    .linear(0.98, 5)
    .webp({ lossless: true }).toBuffer());
}

export async function avatarPreviews(
  bytes: Buffer, contentType: string,
  cleanup: typeof cleanAvatar = cleanAvatar,
): Promise<AvatarPreviews> {
  const original = await normalizeAvatar(bytes, contentType);
  try {
    return { original, cleaned: await cleanup(original) };
  } catch {
    return { original, warning: "Cleanup was unavailable. You can still publish the original." };
  }
}
