import sharp from "sharp";

interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
}

export async function optimizeImage(
  file: Buffer | string,
  options: UploadOptions = {},
) {
  const { maxWidth = 1200, maxHeight = 1500 } = options;

  const buffer: Buffer =
    typeof file === "string"
      ? Buffer.from(file.replace(/^data:image\/\w+;base64,/, ""), "base64")
      : file;

  const optimized = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  return optimized;
}

export async function optimizeVideo(file: Buffer | string) {
  return file;
}
