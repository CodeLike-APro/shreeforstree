import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
}

interface UploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export async function uploadProductImage(
  input: Buffer | string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const {
    folder = "shreeforstree/products",
    maxWidth = 1200,
    maxHeight = 1500,
  } = options;

  const buffer: Buffer =
    typeof input === "string"
      ? Buffer.from(input.replace(/^data:image\/\w+;base64,/, ""), "base64")
      : input;

  const optimized = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const result = await new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary Upload Failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          width: result.width,
          height: result.height,
        });
      },
    );
    stream.end(optimized);
  });
  return result;
}

export async function uploadProductImages(
  inputs: Array<Buffer | string>,
  options: UploadOptions = {},
): Promise<UploadResult[]> {
  return Promise.all(inputs.map((input) => uploadProductImage(input, options)));
}

export async function deleteProductImage(publicId: string) {
  return await cloudinary.uploader.destroy(publicId);
}
