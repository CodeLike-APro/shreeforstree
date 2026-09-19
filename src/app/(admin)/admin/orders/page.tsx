"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import PaginationButtons from "@/components/ui/PaginationButtons";
import { AdminOrdersShimmerGrid } from "@/components/ui/Shimmer";
import {
  formatAmount,
  formatDate,
  itemCount,
  orderReference,
} from "@/lib/orders";

import type { ApiPaginatedResult, Jsonified, Pagination } from "@/types/api";
import type { OrdersListItem } from "@/types/api/orders";
import type { PaymentStatus } from "@/types/models";

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: "text-ink-55",
  success: "text-sage",
  failed: "text-crimson",
  refunded: "text-plum",
  expired: "text-crimson-dark",
};

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [orders, setOrders] = useState<Jsonified<OrdersListItem[]>>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setOrdersError(false);
        const res = await fetch(`/api/orders?page=${currentPage}&limit=10`);
        if (!res.ok) {
          setOrdersError(true);
          return;
        }
        const result: ApiPaginatedResult<OrdersListItem> = await res.json();
        if (!result.success) {
          setOrdersError(true);
          return;
        }

        setOrders(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Failed to load orders:", error);
        setOrdersError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage]);

  return (
    <div className="flex flex-1 flex-col p-4 pb-0">
      <div className="flex flex-1 flex-col">
        {loading ? (
          <AdminOrdersShimmerGrid />
        ) : ordersError ? (
          <p>Error loading orders</p>
        ) : (
          <div className="flex w-full flex-1 flex-col">
            <div className="flex w-full flex-col items-center justify-center gap-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="border-ink/10 btn-focus bg-paper flex w-full items-center justify-between rounded-xl border p-4"
                >
                  <div className="flex flex-col items-start justify-center gap-1">
                    <div className="font-label flex items-center justify-start gap-2 font-semibold">
                      <h5>{orderReference(order.id)}</h5>
                      <OrderStatusBadge
                        kind="order"
                        status={order.orderStatus}
                      />
                    </div>
                    <div className="flex items-center justify-start gap-1">
                      <h6 className="text-ink-55 text-sm">
                        {order.shippingFullName}
                      </h6>
                      <span className="text-ink-55 text-sm font-normal">·</span>
                      <p className="text-ink-55 text-sm">
                        {order.shippingEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <h5 className="font-label font-bold">
                        {formatAmount(order.totalAmount, {
                          fractionalDigits: 0,
                        })}
                      </h5>
                      <p className="text-ink-55 text-sm">
                        {itemCount(order.orderItems.length)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-center gap-1">
                      <h5
                        className={`font-label ${paymentStatusColors[order.paymentStatus]}`}
                      >
                        <span className="text-ink-55 text-sm">Payment:</span>{" "}
                        {order.paymentStatus}
                      </h5>
                      <p className="text-ink-55 text-sm">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="via-paper/90 from-paper to-paper/20 sticky bottom-0 mt-auto flex w-full items-center justify-center bg-linear-to-t pt-5 pb-2">
                <PaginationButtons
                  totalPages={pagination.totalPages}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
