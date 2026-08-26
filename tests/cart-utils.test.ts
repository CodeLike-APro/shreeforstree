import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { query: {}, transaction: vi.fn() },
}));

import { getOrCreateCart, upsertCartItem } from "@/lib/cart-utils";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

describe("getOrCreateCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbAny.query.carts = { findFirst: vi.fn() };
  });

  it("inserts with onConflictDoNothing targeting userId for a logged-in user, then re-selects", async () => {
    const onConflictMock = vi.fn(async () => undefined);
    const valuesMock = vi.fn(() => ({ onConflictDoNothing: onConflictMock }));
    dbAny.insert = vi.fn(() => ({ values: valuesMock }));
    dbAny.query.carts.findFirst.mockResolvedValue({
      id: "cart-1",
      userId: "u1",
      cartItems: [],
    });

    const cart = await getOrCreateCart("u1", "sess-1");

    expect(cart.id).toBe("cart-1");
    expect(valuesMock).toHaveBeenCalledWith({
      userId: "u1",
      sessionId: "sess-1",
    });
    expect(onConflictMock).toHaveBeenCalledTimes(1);
  });

  it("still returns the existing cart when the insert hits the unique constraint (conflict)", async () => {
    // onConflictDoNothing resolves to [] on conflict (no row inserted) —
    // the follow-up select must still find the pre-existing row
    const onConflictMock = vi.fn(async () => []);
    dbAny.insert = vi.fn(() => ({
      values: vi.fn(() => ({ onConflictDoNothing: onConflictMock })),
    }));
    dbAny.query.carts.findFirst.mockResolvedValue({
      id: "existing-cart",
      userId: null,
      sessionId: "sess-1",
      cartItems: [],
    });

    const cart = await getOrCreateCart(null, "sess-1");
    expect(cart.id).toBe("existing-cart");
  });

  it("throws internalServerError if no cart can be found after insert", async () => {
    dbAny.insert = vi.fn(() => ({
      values: vi.fn(() => ({ onConflictDoNothing: vi.fn(async () => []) })),
    }));
    dbAny.query.carts.findFirst.mockResolvedValue(undefined);

    await expect(getOrCreateCart("u1", "sess-1")).rejects.toBeInstanceOf(
      Response,
    );
  });
});

describe("upsertCartItem", () => {
  it("passes the composite unique constraint as the onConflict target and caps via SQL", async () => {
    const returningMock = vi.fn(async () => [
      { id: "item-1", quantity: 5, cartId: "cart-1" },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onConflictDoUpdateMock = vi.fn((_args: any) => ({
      returning: returningMock,
    }));
    const valuesMock = vi.fn(() => ({
      onConflictDoUpdate: onConflictDoUpdateMock,
    }));
    const tx = { insert: vi.fn(() => ({ values: valuesMock })) };

    const item = await upsertCartItem(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx as any,
      {
        cartId: "cart-1",
        productId: "p1",
        size: "M",
        quantity: 2,
        maxQuantity: 10,
      },
    );

    expect(item.quantity).toBe(5);
    expect(valuesMock).toHaveBeenCalledWith({
      cartId: "cart-1",
      productId: "p1",
      size: "M",
      quantity: 2,
    });
    const conflictArgs = onConflictDoUpdateMock.mock.calls[0][0];
    expect(conflictArgs.target).toHaveLength(4);
    expect(conflictArgs.set.quantity).toBeDefined();
  });
});
