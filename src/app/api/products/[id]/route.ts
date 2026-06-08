import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { extractPublicId } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { productCategories } from "@/lib/db/schema";
import { products } from "@/lib/db/schema/products.schema";
import { deleteProductImage } from "@/lib/image-upload";
import { updateProductSchema } from "@/lib/validators/product.validators";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { NextRequest } from "next/server";
import slugify from "slugify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;

    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (!product) {
      return notFound("Product not found");
    }

    return ok("Product fetched successfully", product);
  } catch (error) {
    return internalServerError("Failed to fetch product", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { productId } = await params;
    const body = await request.json();
    const result = await updateProductSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid input data",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const {
      title,
      description,
      price,
      discountedPrice,
      imagesUrl,
      sizes,
      colors,
      isActive,
      isNewArrival,
      isHeroProduct,
      categoryIds,
    } = result.data;

    let { heroImageUrl } = result.data;
    if (isHeroProduct === false && heroImageUrl) {
      heroImageUrl = undefined;
    }

    const slug = title
      ? slugify(title.trim(), { lower: true, strict: true })
      : undefined;

    const foundProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (!foundProduct) {
      return notFound("Product not found");
    }

    if (slug) {
      const existingProduct = await db.query.products.findFirst({
        where: (products, { and, eq, ne }) =>
          and(eq(products.slug, slug), ne(products.id, productId)),
      });

      if (existingProduct) {
        return conflict("A product with the same title already exists.");
      }
    }

    if (isHeroProduct === false && foundProduct.heroImageUrl) {
      try {
        const publicId = extractPublicId(foundProduct.heroImageUrl);
        await deleteProductImage(publicId);
      } catch (error) {
        console.error("Failed to delete hero image from Cloudinary", error);
        // continue anyway
      }
    }

    let updatedProduct: typeof foundProduct | undefined;

    if (categoryIds) {
      await db.transaction(async (tx) => {
        [updatedProduct] = await tx
          .update(products)
          .set({
            ...(title && { title: title.trim(), slug }),
            ...(description && { description: description.trim() }),
            ...(price && { price }),
            ...(discountedPrice && { discountedPrice }),
            ...(imagesUrl && { imagesUrl }),
            ...(sizes && { sizes }),
            ...(colors && { colors }),
            ...(isActive !== undefined && { isActive }),
            ...(isNewArrival !== undefined && { isNewArrival }),
            ...(isHeroProduct !== undefined && { isHeroProduct }),
            ...(heroImageUrl && { heroImageUrl: heroImageUrl.trim() }),
            ...(isHeroProduct === false && { heroImageUrl: null }),
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId))
          .returning();

        await tx
          .delete(productCategories)
          .where(eq(productCategories.productId, productId));

        await tx
          .insert(productCategories)
          .values(categoryIds.map((categoryId) => ({ productId, categoryId })));
      });
    } else {
      [updatedProduct] = await db
        .update(products)
        .set({
          ...(title && { title: title.trim(), slug }),
          ...(description && { description: description.trim() }),
          ...(price && { price }),
          ...(discountedPrice && { discountedPrice }),
          ...(imagesUrl && { imagesUrl }),
          ...(sizes && { sizes }),
          ...(colors && { colors }),
          ...(isActive !== undefined && { isActive }),
          ...(isNewArrival !== undefined && { isNewArrival }),
          ...(isHeroProduct !== undefined && { isHeroProduct }),
          ...(heroImageUrl && { heroImageUrl: heroImageUrl.trim() }),
          ...(isHeroProduct === false && { heroImageUrl: null }),
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();
    }

    if (!updatedProduct) {
      return internalServerError("Failed to update product");
    }

    return ok("Product updated successfully", updatedProduct);
  } catch (error) {
    return internalServerError("Failed to update product", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { productId } = await params;

    const foundProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (!foundProduct) {
      return notFound("Product not found");
    }

    const imageUrls = [
      ...foundProduct.imagesUrl,
      ...(foundProduct.heroImageUrl ? [foundProduct.heroImageUrl] : []),
    ];

    const publicIds = imageUrls.map((url) => extractPublicId(url));

    try {
      await Promise.all(publicIds.map((id) => deleteProductImage(id)));
    } catch (error) {
      console.error("Failed to delete images from Cloudinary", error);
    }

    await db.delete(products).where(eq(products.id, productId));

    await db.delete(products).where(eq(products.id, productId));

    return ok("Product deleted successfully");
  } catch (error) {
    return internalServerError("Failed to delete product", error);
  }
}
