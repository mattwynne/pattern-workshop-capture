import sharp from "sharp";

export interface PublicAvatar {
  bytes: Buffer;
  extension: "webp";
  contentType: "image/webp";
}

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function normalizeAvatar(bytes: Buffer, contentType: string): Promise<PublicAvatar> {
  if (!allowedTypes.has(contentType)) throw new Error("Choose a JPEG, PNG, WebP, or HEIC image");
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error("Image dimensions are missing");
    const normalized = await image
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, smartSubsample: true })
      .toBuffer();
    return { bytes: normalized, extension: "webp", contentType: "image/webp" };
  } catch (error) {
    if (error instanceof Error && /Choose|dimensions/.test(error.message)) throw error;
    throw new Error("That image could not be read; choose another one");
  }
}
