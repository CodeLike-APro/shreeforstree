import { getCldImageUrl } from "next-cloudinary";

export const IMAGE_PRESETS = {
  thumbnail: {
    width: 150,
    height: 150,
    crop: "fill",
  },
  card: {
    width: 400,
    height: 500,
    crop: "fill",
  },
  full: {
    width: 800,
    height: 1000,
    crop: "fill",
  },
};

export type ImagePreset = keyof typeof IMAGE_PRESETS;

export function getImageUrl(
  publicId: string,
  preset: ImagePreset = "card",
): string {
  const { width, height, crop } = IMAGE_PRESETS[preset];

  return getCldImageUrl({
    src: publicId,
    width,
    height,
    crop: crop as "fill",
  });
}

export function extractPublicId(secureUrl: string): string {
  return (
    secureUrl
      .split("/upload")[1]
      ?.replace(/^v\d+\//, "")
      .replace(/\.[^/.]+$/, "") ?? secureUrl
  );
}
