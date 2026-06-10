import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
      with: { categories: { with: { category: true } } },
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { id: productId } = await params;
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
      imagesPublicId,
      sizes,
      colors,
      isActive,
      isNewArrival,
      isHeroProduct,
      heroImageUrl,
      heroImagePublicId,
      categoryIds,
    } = result.data;

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

    if (isHeroProduct === false && foundProduct.heroImagePublicId) {
      try {
        await deleteProductImage(foundProduct.heroImagePublicId);
      } catch (error) {
        console.error("Failed to delete hero image from Cloudinary", error);
        // continue anyway
      }
    }

    if (imagesPublicId) {
      const removedImages = foundProduct.imagesPublicId.filter(
        (publicId) => !imagesPublicId.includes(publicId),
      );
      try {
        await Promise.all(
          removedImages.map((publicId) => deleteProductImage(publicId)),
        );
      } catch (error) {
        console.error("Failed to delete removed images from Cloudinary", error);
      }
    }

    if (
      heroImageUrl &&
      foundProduct.heroImagePublicId &&
      heroImagePublicId !== foundProduct.heroImagePublicId
    ) {
      try {
        await deleteProductImage(foundProduct.heroImagePublicId);
      } catch (error) {
        internalServerError(
          "Failed to delete old hero image from Cloudinary",
          error,
        );
      }
    }

    let updatedProduct: typeof foundProduct | undefined;

    const updateData = {
      ...(title && { title: title.trim(), slug }),
      ...(description && { description: description.trim() }),
      ...(price && { price }),
      ...(discountedPrice && { discountedPrice }),
      ...(imagesUrl && { imagesUrl }),
      ...(imagesPublicId && { imagesPublicId }),
      ...(sizes && { sizes }),
      ...(colors && { colors }),
      ...(isActive !== undefined && { isActive }),
      ...(isNewArrival !== undefined && { isNewArrival }),
      ...(isHeroProduct !== undefined && { isHeroProduct }),
      ...(heroImageUrl && { heroImageUrl: heroImageUrl.trim() }),
      ...(heroImagePublicId && {
        heroImagePublicId: heroImagePublicId.trim(),
      }),
      ...(isHeroProduct === false && {
        heroImageUrl: null,
        heroImagePublicId: null,
      }),
    };

    if (categoryIds) {
      await db.transaction(async (tx) => {
        [updatedProduct] = await tx
          .update(products)
          .set(updateData)
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
        .set(updateData)
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const { id: productId } = await params;

    const foundProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (!foundProduct) {
      return notFound("Product not found");
    }

    const imagePublicIds = [
      ...foundProduct.imagesPublicId,
      ...(foundProduct.heroImagePublicId
        ? [foundProduct.heroImagePublicId]
        : []),
    ];

    try {
      await Promise.all(imagePublicIds.map((id) => deleteProductImage(id)));
    } catch (error) {
      console.error("Failed to delete images from Cloudinary", error);
    }

    await db.delete(products).where(eq(products.id, productId));

    return ok("Product deleted successfully");
  } catch (error) {
    return internalServerError("Failed to delete product", error);
  }
}
