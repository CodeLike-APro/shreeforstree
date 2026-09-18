import { and, count, eq, inArray } from "drizzle-orm";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  internalServerError,
  notFound,
  paginated,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { orderItems } from "@/lib/db/schema";
import { orders } from "@/lib/db/schema/order.schema";
import { reviews } from "@/lib/db/schema/review.schema";
import { isOwnedMediaPath } from "@/lib/media/path-guard";
import { createReviewSchema } from "@/lib/validators/review.validators";

import type { ProductReview } from "@/types/api/reviews";
import type { Review } from "@/types/models";
import type { SQL } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    const product = await db.query.products.findFirst({
      where: (products, { and, eq }) =>
        and(eq(products.id, productId), eq(products.isActive, true)),
    });

    if (!product) {
      return notFound("Product not found");
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(
      1,
      parseInt(searchParams.get("limit") ?? "10") || 10,
    );
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];
    const rating = searchParams.get("rating");

    conditions.push(eq(reviews.productId, product.id));

    if (rating) {
      const ratingValue = parseInt(rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return badRequest("Invalid rating value");
      }
      conditions.push(eq(reviews.rating, ratingValue));
    }

    const countResult = await db
      .select({ count: count() })
      .from(reviews)
      .where(conditions.length ? and(...conditions) : undefined);

    const reviewData = await db.query.reviews.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      limit,
      offset,
      with: {
        user: {
          columns: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: (reviews, { desc }) => desc(reviews.createdAt),
    });

    const totalReviews = countResult[0]?.count ?? 0;

    return paginated<ProductReview>(
      "Reviews fetched successfully",
      reviewData,
      totalReviews,
      page,
      limit,
    );
  } catch (error) {
    return internalServerError(
      "An error occurred while fetching reviews",
      error,
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return unauthorized("Please login to write a review");
    }

    const { id: productId } = await params;

    const product = await db.query.products.findFirst({
      where: (products, { and, eq }) =>
        and(eq(products.id, productId), eq(products.isActive, true)),
    });

    if (!product) {
      return notFound("Product not found");
    }

    const body = await request.json();

    const result = await createReviewSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
    }

    const existingReview = await db.query.reviews.findFirst({
      where: (reviews, { and, eq }) =>
        and(
          eq(reviews.userId, currentUser.id),
          eq(reviews.productId, productId),
        ),
    });

    if (existingReview) {
      return conflict("You have already reviewed this product");
    }

    const validOrder = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, currentUser.id),
          eq(orderItems.productId, productId),
          inArray(orders.orderStatus, ["delivered", "returned"]),
        ),
      )
      .limit(1);

    if (validOrder.length === 0) {
      return forbidden(
        "You can only review products you have purchased and received",
      );
    }

    const { rating, imagesUrl, imagesPath } = result.data;

    // imagesPath is later passed to deleteFiles on review deletion — restrict
    // it to this user's own review upload folder for this product
    if (
      imagesPath?.some(
        (path) =>
          !isOwnedMediaPath(path, `reviews/${currentUser.id}/${productId}`),
      )
    ) {
      return badRequest(
        "imagesPath entries must point to your own review uploads for this product",
      );
    }

    const comments = result.data.comments?.trim() || null;

    try {
      const [newReview] = await db
        .insert(reviews)
        .values({
          userId: currentUser.id,
          productId,
          rating,
          comments,
          imagesUrl,
          imagesPath,
          isVerified: true,
        })
        .returning();

      return created<Review>("Review created successfully", newReview);
    } catch (error) {
      // unique (userId, productId) violation from a concurrent submission
      if (isUniqueViolation(error)) {
        return conflict("You have already reviewed this product");
      }
      throw error;
    }
  } catch (error) {
    return internalServerError(
      "An error occurred while creating the review",
      error,
    );
  }
}
