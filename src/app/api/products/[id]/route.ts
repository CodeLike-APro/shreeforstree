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
import { productCategories, productMedia } from "@/lib/db/schema";
import { products } from "@/lib/db/schema/products.schema";
import { deleteFiles } from "@/lib/media/media-handle";
import { updateProductSchema } from "@/lib/validators/product.validators";
import { and, eq, inArray } from "drizzle-orm/sql/expressions/conditions";
import { NextRequest } from "next/server";
import slugify from "slugify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await adminCheck(request);
    const { id: productId } = await params;

    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
      with: {
        categories: { with: { category: true } },
        productMedia: {
          orderBy: (media, { asc }) => asc(media.sortOrder),
        },
      },
    });

    if (!product) {
      return notFound("Product not found");
    }

    if (!isAdmin && !product.isActive) {
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
      sizes,
      colors,
      isActive,
      isNewArrival,
      isHeroProduct,
      categoryIds,
      media,
    } = result.data;

    const slug = title
      ? slugify(title.trim(), { lower: true, strict: true })
      : undefined;

    const foundProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
      with: { productMedia: true, categories: { with: { category: true } } },
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

    const existingPaths =
      media && media.length > 0
        ? new Set(foundProduct.productMedia.map((media) => media.path))
        : new Set<string>();

    const incomingPaths =
      media && media.length > 0
        ? new Set(media.map((media) => media.path))
        : new Set<string>();

    const toInsert =
      media?.filter((media) => !existingPaths.has(media.path)) || [];

    const toUpdateSortOrder = media?.filter((media) =>
      existingPaths.has(media.path),
    );

    const toDelete = Array.from(existingPaths).filter(
      (media) => !incomingPaths.has(media),
    );

    try {
      await deleteFiles(toDelete);
    } catch (error) {
      console.error("Failed to delete media files", error);
    }

    if (toDelete.length > 0) {
      await db.delete(productMedia).where(inArray(productMedia.path, toDelete));
    }

    try {
      const updateData = {
        ...(title !== undefined && { title: title.trim(), slug }),
        ...(description !== undefined && { description: description.trim() }),
        ...(price !== undefined && { price }),
        ...(discountedPrice !== undefined && { discountedPrice }),
        ...(sizes !== undefined && { sizes }),
        ...(colors !== undefined && { colors }),
        ...(isActive !== undefined && { isActive }),
        ...(isNewArrival !== undefined && { isNewArrival }),
        ...(isHeroProduct !== undefined && { isHeroProduct }),
      };

      await db.transaction(async (tx) => {
        if (Object.keys(updateData).length > 0) {
          await tx
            .update(products)
            .set(updateData)
            .where(eq(products.id, productId));
        }

        if (categoryIds) {
          await tx
            .delete(productCategories)
            .where(eq(productCategories.productId, productId));

          await tx
            .insert(productCategories)
            .values(
              categoryIds.map((categoryId) => ({ productId, categoryId })),
            );
        }

        if (toInsert.length > 0) {
          await tx.insert(productMedia).values(
            toInsert.map((file) => ({
              productId,
              type: file.type,
              url: file.url,
              path: file.path,
              sortOrder: file.sortOrder,
            })),
          );
        }

        if (toUpdateSortOrder && toUpdateSortOrder.length > 0) {
          for (const media of toUpdateSortOrder) {
            await tx
              .update(productMedia)
              .set({ sortOrder: media.sortOrder })
              .where(
                and(
                  eq(productMedia.productId, productId),
                  eq(productMedia.path, media.path),
                ),
              );
          }
        }
      });

      const updatedProduct = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, productId),
        with: {
          productMedia: true,
          categories: {
            with: {
              category: true,
            },
          },
        },
      });

      if (!updatedProduct) {
        return internalServerError("Failed to update product");
      }

      return ok("Product updated successfully", updatedProduct);
    } catch (error) {
      console.error("Failed to update product", error);
      return internalServerError("Failed to update product", error);
    }
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
      with: { productMedia: { columns: { path: true } } },
    });

    if (!foundProduct) {
      return notFound("Product not found");
    }

    const hasOrders = await db.query.orderItems.findFirst({
      where: (oi, { eq }) => eq(oi.productId, productId),
    });
    if (hasOrders)
      return badRequest(
        "Cannot delete product with existing orders. Set isActive to false instead.",
      );

    if (foundProduct.productMedia.length > 0) {
      try {
        await deleteFiles(foundProduct.productMedia.map((m) => m.path));
      } catch (error) {
        console.error("Failed to delete product media files", error);
      }
    }

    await db.delete(products).where(eq(products.id, productId));

    return ok("Product deleted successfully");
  } catch (error) {
    return internalServerError("Failed to delete product", error);
  }
}
