import "server-only";
import sharp from "sharp";

interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
}

//TODO: Add support for video optimization and dimensions for images

export async function optimizeImage(file: File, options: UploadOptions = {}) {
  const { maxWidth = 1200, maxHeight = 1500 } = options;

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const optimized = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  return optimized;
}

export async function optimizeVideo(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}
