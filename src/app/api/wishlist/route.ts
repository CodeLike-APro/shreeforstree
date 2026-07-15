import {
  badRequest,
  conflict,
  created,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { productMedia, products, wishlist } from "@/lib/db/schema";
import { addWishlistSchema } from "@/lib/validators/wishlist.validators";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return unauthorized("Please login to view your wishlist");
    }

    const wishlistItems = await db
      .select({
        productId: wishlist.productId,
        title: products.title,
        price: products.price,
        discountedPrice: products.discountedPrice,
        slug: products.slug,
        imageUrl: productMedia.url,
      })
      .from(wishlist)
      .innerJoin(products, eq(wishlist.productId, products.id))
      .leftJoin(
        productMedia,
        and(
          eq(productMedia.productId, products.id),
          eq(productMedia.sortOrder, 0),
        ),
      )
      .where(
        and(eq(wishlist.userId, currentUser.id), eq(products.isActive, true)),
      )
      .orderBy(desc(wishlist.addedAt));

    return ok("Wishlist fetched successfully", wishlistItems);
  } catch (error) {
    return internalServerError(
      "Something went wrong while fetching your wishlist",
      error,
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return unauthorized("Please login to add items to your wishlist");
    }

    const body = await request.json();

    const result = addWishlistSchema.safeParse(body);

    if (!result.success) {
      return badRequest("Invalid request body");
    }

    const { productId } = result.data;

    const productExists = await db.query.products.findFirst({
      where: (products, { and, eq }) =>
        and(eq(products.id, productId), eq(products.isActive, true)),
      columns: { id: true },
    });

    if (!productExists) {
      return notFound("Product not found");
    }

    const existingWishlistItem = await db.query.wishlist.findFirst({
      where: (wishlist, { and, eq }) =>
        and(
          eq(wishlist.userId, currentUser.id),
          eq(wishlist.productId, productId),
        ),
      columns: { productId: true },
    });

    if (existingWishlistItem) {
      return conflict("Product already in wishlist");
    }

    const [newWishlistItem] = await db
      .insert(wishlist)
      .values({
        userId: currentUser.id,
        productId,
      })
      .returning();

    return created("Product added to wishlist successfully", newWishlistItem);
  } catch (error) {
    return internalServerError(
      "Something went wrong while adding item to wishlist",
      error,
    );
  }
}
