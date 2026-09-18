import type { Order, OrderStatus } from "../models";

export type StatsPeriod =
  "week" | "month" | "quarter" | "year" | "2year" | "custom";

export type AdminStats = {
  period: StatsPeriod;
  dateRange: { from: string; to: string };
  revenue: {
    total: number;
    period: number;
    totalDiscount: number;
    periodDiscount: number;
    averageOrderValue: number;
  };
  orders: {
    byStatus: Partial<Record<OrderStatus, number>>;
    periodTotal: number;
    pendingRefunds: number;
    recent: Pick<
      Order,
      | "id"
      | "totalAmount"
      | "orderStatus"
      | "paymentStatus"
      | "createdAt"
      | "shippingFullName"
    >[];
  };
  users: { total: number; periodNew: number };
  products: {
    total: number;
    active: number;
    inactive: number;
    topSelling: TopSellingProduct[];
  };
  reviews: { total: number; averageRating: string };
};

export type TopSellingProduct = {
  productId: string | null;
  productTitle: string;
  productImageUrl: string;
  totalSold: string | null;
};
