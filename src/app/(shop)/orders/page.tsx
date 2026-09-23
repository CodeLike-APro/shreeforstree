import { ChevronRight } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  formatAmount,
  formatDate,
  itemCount,
  orderReference,
} from "@/lib/orders";

import type { OrdersListItem } from "@/types/api/orders";

export default async function Orders() {
  const currentUser = await getCurrentUser(await headers());

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-center">
        You are not logged in.
      </div>
    );
  }

  const orders: OrdersListItem[] = await db.query.orders.findMany({
    where: (orders, { eq }) => eq(orders.userId, currentUser?.id),
    with: {
      orderItems: {
        columns: {
          id: true,
          productImageUrl: true,
        },
      },
    },
    orderBy: (orders, { desc }) => desc(orders.createdAt),
  });

  return (
    <div className="p-6">
      <div>
        <h1 className="text-3xl">Orders</h1>
        <p className="text-ink-55">Everything you have ordered from us</p>
      </div>
      <div className="mt-7 w-full">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="border-ink/10 hover:border-rose-gold group flex w-full items-center rounded-xl border p-4 transition-colors duration-150"
          >
            <div className="flex w-full items-center gap-4">
              {order.orderItems[0].productImageUrl && (
                <div className="relative aspect-square w-17 overflow-hidden rounded-md">
                  <Image
                    src={order.orderItems[0].productImageUrl}
                    alt={order.orderItems[0].id}
                    fill={true}
                    className="aspect-square h-auto rounded-md object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <h4 className="font-label font-semibold">
                    Order ID: {orderReference(order.id)}
                  </h4>
                  <OrderStatusBadge kind="order" status={order.orderStatus} />
                </div>
                <p className="text-ink-55 flex gap-2">
                  <span>{formatDate(order.createdAt)},</span>
                  <span>{itemCount(order.orderItems.length)}</span>
                </p>
              </div>
            </div>
            <div className="mr-2 flex h-full items-center gap-1">
              <h4 className="font-label leading-none font-bold">
                {formatAmount(order.totalAmount)}
              </h4>
              <ChevronRight
                size={18}
                className="text-ink-55 group-hover:text-rose-gold mb-0.75 transition-all duration-150 group-hover:translate-x-0.5 group-hover:scale-110"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
