import type { Category, ProductMedia, User } from "../models";

// gallery / fabric / review uploads
export type UploadedMedia = {
  url: string;
  path: string;
  type: "image" | "video";
};

// Admin: hero-product
export type HeroUploadData = Pick<ProductMedia, "url" | "path" | "type">;

// Admin: category
export type CategoryImageUploadData = Pick<
  Category,
  "categoryImageUrl" | "categoryImagePath"
>;

// Admin: category-size-chart
export type SizeChartUploadData = Pick<
  Category,
  "sizeChartImageUrl" | "sizeChartImagePath"
>;

// User: avatar
export type AvatarUploadData = Pick<User, "image" | "image_path">;
