import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema/review.schema";
import { deleteFiles } from "@/lib/media/media-handle";
import { eq } from "drizzle-orm/sql/expressions/conditions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return unauthorized("You must be logged in to delete a review");
    }

    const { id: reviewId } = await params;

    if (!reviewId) {
      return badRequest("Review ID is required");
    }

    const review = await db.query.reviews.findFirst({
      where: (reviews, { eq }) => eq(reviews.id, reviewId),
    });

    if (!review) {
      return notFound("Review not found");
    }

    const isAdmin = currentUser.role === "admin";
    if (review.userId !== currentUser.id && !isAdmin) {
      return forbidden("You do not have permission to delete this review");
    }

    if (review.imagesPath && review.imagesPath.length > 0) {
      try {
        await deleteFiles(review.imagesPath);
      } catch (error) {
        internalServerError("Failed to delete review images", error);
      }
    }

    const deletedReview = await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))
      .returning();

    return ok("Review deleted successfully", deletedReview);
  } catch (error) {
    return internalServerError(
      "An error occurred while deleting the review",
      error,
    );
  }
}
