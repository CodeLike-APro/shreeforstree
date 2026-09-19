import { headers } from "next/headers";
import Link from "next/link";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { formatDate, orderReference } from "@/lib/orders";

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
        },
      },
    },
    orderBy: (orders, { desc }) => desc(orders.createdAt),
  });

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-5 text-center">
      <div>Total orders: {orders.length}</div>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="flex cursor-pointer rounded-xl"
        >
          <dl className="bg-opacity-30 border-ink/10 bg-paper grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-xl border p-6 text-sm shadow-sm sm:text-base">
            <dt className="text-opacity-60 text-ink flex items-center font-medium">
              Order ID:
            </dt>
            <dd className="text-ink-deep text-right font-mono font-semibold sm:text-left">
              {orderReference(order.id)}
            </dd>

            <dt className="text-opacity-60 text-ink flex items-center font-medium">
              Order Status:
            </dt>
            <dd className="flex items-center justify-start text-right sm:text-left">
              <OrderStatusBadge kind={"order"} status={order.orderStatus} />
            </dd>

            <dt className="text-opacity-60 text-ink flex items-center font-medium">
              Order Date:
            </dt>
            <dd className="text-ink text-right sm:text-left">
              {formatDate(order.createdAt)}
            </dd>

            <dt className="text-opacity-60 text-ink flex items-center font-medium">
              Number of Items:
            </dt>
            <dd className="text-ink text-right font-semibold sm:text-left">
              {order.orderItems.length}
            </dd>
          </dl>
        </Link>
      ))}
    </div>
  );
}
