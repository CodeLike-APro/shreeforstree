import type {
  Category,
  Product,
  ProductCategory,
  ProductMedia,
} from "../models";

type ProductCategoryLink<C> = ProductCategory & { category: C };

// GET /api/products: listing/search card. 3 gallery images, category title + size chart

export type ProductListItem = Product & {
  productMedia: ProductMedia[];
  categories: ProductCategoryLink<
    Pick<Category, "title" | "sizeChartImageUrl">
  >[];
};

// GET / PATCH /api/products/[id]: full media (hero + gallery + fabric), full category rows

export type ProductDetail = Product & {
  productMedia: ProductMedia[];
  categories: ProductCategoryLink<Category>[];
};

export type ProductDetailWithRating = ProductDetail & {
  averageRating: string;
  reviewCount: number;
};

// PATCH /api/products/[id] request body: already-uploaded media refs

export type ProductMediaRef = Pick<
  ProductMedia,
  "url" | "path" | "type" | "sortOrder"
>;
