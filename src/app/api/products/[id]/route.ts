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
import { uploadFiles } from "@/lib/media/media-handle";
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
      with: { categories: { with: { category: true } }, productMedia: true },
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
    const formData = await request.formData();
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      price: formData.get("price"),
      discountedPrice: formData.get("discountedPrice"),
      sizes: formData.getAll("sizes"),
      colors: formData.getAll("colors"),
      isActive: formData.get("isActive") === "true",
      isNewArrival: formData.get("isNewArrival") === "true",
      isHeroProduct: formData.get("isHeroProduct") === "true",
      categoryIds: formData.getAll("categoryIds"),
    };
    const files = formData.getAll("files") as File[];
    const result = await updateProductSchema.safeParseAsync(data);

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

    const uploadedFilesData = await uploadFiles(files, `products/${productId}`);

    //TODO: Add delete removed files, and sort order of files

    const updateData = {
      ...(title && { title: title.trim(), slug }),
      ...(description && { description: description.trim() }),
      ...(price && { price }),
      ...(discountedPrice && { discountedPrice }),

      ...(sizes && { sizes }),
      ...(colors && { colors }),
      ...(isActive !== undefined && { isActive }),
      ...(isNewArrival !== undefined && { isNewArrival }),
      ...(isHeroProduct !== undefined && { isHeroProduct }),

      ...(isHeroProduct === false && {
        heroImageUrl: null,
        heroImagePublicId: null,
      }),
    };

    if (categoryIds) {
      await db.transaction(async (tx) => {
        await tx
          .update(products)
          .set(updateData)
          .where(eq(products.id, productId));

        await tx
          .delete(productCategories)
          .where(eq(productCategories.productId, productId));

        await tx
          .insert(productCategories)
          .values(categoryIds.map((categoryId) => ({ productId, categoryId })));
      });
    } else {
      await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, productId));
    }

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

    //TODO: Delete product media files from cloud storage if any

    await db.delete(products).where(eq(products.id, productId));

    return ok("Product deleted successfully");
  } catch (error) {
    return internalServerError("Failed to delete product", error);
  }
}
