import { forbidden, internalServerError, paginated } from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { count, isNull } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const isAdmin = await adminCheck(request);

    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: count() })
      .from(user)
      .where(isNull(user.deletedAt));

    const users = await db.query.user.findMany({
      where: (user, { isNull }) => isNull(user.deletedAt),
      limit: limit,
      offset: offset,
    });
    return paginated(
      "Data fetched successfully",
      users,
      countResult[0].count,
      page,
      limit,
    );
  } catch (error) {
    return internalServerError("Failed to fetch users", error);
  }
}
