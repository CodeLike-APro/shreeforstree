import {
  and,
  avg,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  sql,
  sum,
} from "drizzle-orm";
import {
  badRequest,
  forbidden,
  internalServerError,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { orderItems, orders, products, reviews, user } from "@/lib/db/schema";

import type { AdminStats, StatsPeriod } from "@/types/api/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await adminCheck(request);
    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }
    const periodParam = request.nextUrl.searchParams.get("period") ?? "month";
    const fromParam = request.nextUrl.searchParams.get("from");
    const toParam = request.nextUrl.searchParams.get("to");

    let startDate: Date;
    let endDate: Date = new Date();
    const PERIODS: Record<string, number> = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
      "2year": 730,
    };

    const period: StatsPeriod =
      fromParam && toParam
        ? "custom"
        : periodParam in PERIODS
          ? (periodParam as StatsPeriod)
          : "month";

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      endDate = new Date(toParam);
      // validate both are valid dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return badRequest("Invalid date format. Use ISO 8601 format.");
      }
      if (startDate > endDate) {
        return badRequest("Start date must be before end date");
      }
    } else {
      const days = PERIODS[periodParam] ?? 30;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    const [
      revenueStats,
      orderStats,
      orderStatusStats,
      pendingRefunds,
      userStats,
      userPeriodStats,
      productStats,
      topProducts,
      reviewStats,
      recentOrders,
    ] = await Promise.all([
      // revenue query
      db
        .select({
          totalRevenue: sum(orders.totalAmount),
          totalDiscount: sum(orders.discountAmount),
          averageOrderValue: avg(orders.totalAmount),
        })
        .from(orders)
        .where(eq(orders.paymentStatus, "success")),
      db
        .select({
          periodRevenue: sum(orders.totalAmount),
          periodOrders: count(),
          periodDiscount: sum(orders.discountAmount),
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "success"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate),
          ),
        ),
      // orders count by status
      db
        .select({
          status: orders.orderStatus,
          count: count(),
        })
        .from(orders)
        .groupBy(orders.orderStatus),
      // refund count
      db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.refundRequired, true)),
      // users count
      db
        .select({
          total: count(),
        })
        .from(user)
        .where(isNull(user.deletedAt)),
      db
        .select({
          periodNew: count(),
        })
        .from(user)
        .where(
          and(
            isNull(user.deletedAt),
            gte(user.createdAt, startDate),
            lte(user.createdAt, endDate),
          ),
        ),
      // products count
      db
        .select({
          total: count(),
          active: sum(
            sql`CASE WHEN ${products.isActive} = true THEN 1 ELSE 0 END`,
          ),
          inactive: sum(
            sql`CASE WHEN ${products.isActive} = false THEN 1 ELSE 0 END`,
          ),
        })
        .from(products),
      // top 5 selling products
      db
        .select({
          productId: orderItems.productId,
          productTitle: orderItems.productTitle,
          productImageUrl: orderItems.productImageUrl,
          totalSold: sum(orderItems.quantity),
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(eq(orders.paymentStatus, "success"))
        .groupBy(
          orderItems.productId,
          orderItems.productTitle,
          orderItems.productImageUrl,
        )
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(5),
      // reviews avg + count
      db
        .select({
          total: count(),
          averageRating: avg(reviews.rating),
        })
        .from(reviews),
      // recent 5 orders
      db.query.orders.findMany({
        limit: 5,
        orderBy: (orders, { desc }) => desc(orders.createdAt),
        columns: {
          id: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          shippingFullName: true,
        },
      }),
    ]);

    const { totalRevenue, totalDiscount, averageOrderValue } =
      revenueStats[0] ?? {};

    const { periodRevenue, periodOrders, periodDiscount } = orderStats[0] ?? {};

    const { total: totalUsers } = userStats[0] ?? {};
    const { periodNew } = userPeriodStats[0] ?? {};

    const byStatus = Object.fromEntries(
      orderStatusStats.map((row) => [row.status, row.count]),
    );

    const pendingRefundsCount = pendingRefunds[0]?.count ?? 0;

    const { total: totalProducts, active, inactive } = productStats[0] ?? {};

    const { total: totalReviews, averageRating } = reviewStats[0] ?? {};

    return ok<AdminStats>("Stats fetched successfully", {
      period,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      revenue: {
        total: parseFloat(totalRevenue ?? "0"),
        period: parseFloat(periodRevenue ?? "0"),
        totalDiscount: parseFloat(totalDiscount ?? "0"),
        periodDiscount: parseFloat(periodDiscount ?? "0"),
        averageOrderValue: parseFloat(averageOrderValue ?? "0"),
      },
      orders: {
        byStatus,
        periodTotal: periodOrders,
        pendingRefunds: pendingRefundsCount,
        recent: recentOrders,
      },
      users: {
        total: totalUsers,
        periodNew,
      },
      products: {
        total: totalProducts,
        active: parseInt(active ?? "0"),
        inactive: parseInt(inactive ?? "0"),
        topSelling: topProducts,
      },
      reviews: {
        total: totalReviews,
        averageRating: parseFloat(averageRating ?? "0").toFixed(1),
      },
    });
  } catch (error) {
    return internalServerError("Failed to fetch stats", error);
  }
}
