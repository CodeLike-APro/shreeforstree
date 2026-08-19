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
import { products, wishlist } from "@/lib/db/schema";
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
        addedAt: wishlist.addedAt,
        product: {
          id: products.id,
          title: products.title,
          price: products.price,
          discountedPrice: products.discountedPrice,
          slug: products.slug,
        },
      })
      .from(wishlist)
      .innerJoin(
        products,
        and(eq(products.id, wishlist.productId), eq(products.isActive, true)),
      )
      .where(eq(wishlist.userId, currentUser.id))
      .orderBy(desc(wishlist.addedAt));

    if (wishlistItems.length === 0) {
      return ok("Wishlist fetched successfully", []);
    }

    const productIds = wishlistItems.map((item) => item.product.id);

    // fetch top 3 gallery images per product, same shape as GET /api/products
    const productsMedia = await db.query.products.findMany({
      where: (products, { inArray }) => inArray(products.id, productIds),
      columns: { id: true },
      with: {
        productMedia: {
          where: (media, { and, eq }) =>
            and(eq(media.isHero, false), eq(media.isFabricSwatch, false)),
          orderBy: (media, { asc }) => asc(media.sortOrder),
          limit: 3,
        },
      },
    });

    const mediaByProductId = new Map(
      productsMedia.map((p) => [p.id, p.productMedia]),
    );

    const itemsWithMedia = wishlistItems.map((item) => ({
      ...item,
      product: {
        ...item.product,
        productMedia: mediaByProductId.get(item.product.id) ?? [],
      },
    }));

    return ok("Wishlist fetched successfully", itemsWithMedia);
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

    const result = await addWishlistSchema.safeParseAsync(body);

    if (!result.success) {
      return badRequest(
        "Invalid request body",
        result.error.flatten((issue) => issue.message).fieldErrors,
      );
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
