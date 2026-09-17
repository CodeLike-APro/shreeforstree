import { and, eq } from "drizzle-orm/sql/expressions/conditions";
import z4 from "zod/v4";
import {
  badRequest,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { wishlist } from "@/lib/db/schema/wishlist.schema";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return unauthorized("Please login to remove items from your wishlist");
    }

    const { productId: body } = await params;

    const isProductIdValid = await z4.uuid().safeParseAsync(body);

    if (!isProductIdValid.success) {
      return badRequest("Invalid product ID");
    }

    const productId = isProductIdValid.data;

    const wishlistItem = await db.query.wishlist.findFirst({
      where: (wishlist, { and, eq }) =>
        and(
          eq(wishlist.userId, currentUser.id),
          eq(wishlist.productId, productId),
        ),
    });

    if (!wishlistItem) {
      return notFound("Item not found in wishlist");
    }

    const [deletedItem] = await db
      .delete(wishlist)
      .where(
        and(
          eq(wishlist.userId, currentUser.id),
          eq(wishlist.productId, productId),
        ),
      )
      .returning();
    return ok("Item removed from wishlist successfully", deletedItem);
  } catch (error) {
    return internalServerError(
      "Something went wrong while removing item from wishlist",
      error,
    );
  }
}
