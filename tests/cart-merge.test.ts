import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn(), query: {} },
}));

import { POST } from "@/app/api/cart/merge/route";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

function mergeRequest() {
  return new Request("http://test/api/cart/merge", {
    method: "POST",
    headers: { "x-session-id": "sess-1" },
  });
}

describe("POST /api/cart/merge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as any);
  });

  it("returns 400 (not 200 wrapping a Response) when there is no guest cart", async () => {
    const tx = {
      query: {
        carts: { findFirst: vi.fn(async () => undefined) },
        cartItems: { findFirst: vi.fn(), findMany: vi.fn() },
      },
    };
    vi.mocked(db.transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (cb: any) => cb(tx),
    );

    const res = await POST(mergeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("No guest cart found to merge");
  });

  it("returns the merged cart when a guest cart exists", async () => {
    const guestCart = { id: "guest-cart", sessionId: "sess-1", userId: null };
    const userCart = { id: "user-cart", sessionId: "old", userId: "u1" };
    const insertOnConflictMock = vi.fn(async () => undefined);
    const tx = {
      query: {
        carts: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce(guestCart) // guest cart lookup
            .mockResolvedValueOnce(userCart), // user cart lookup post-insert
        },
        cartItems: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(async () => undefined),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: insertOnConflictMock,
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn(async () => []) })),
      })),
    };
    vi.mocked(db.transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (cb: any) => cb(tx),
    );

    const res = await POST(mergeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("user-cart");
    expect(insertOnConflictMock).toHaveBeenCalledTimes(1);
  });

  it("merges guest items via atomic upsert instead of a duplicate insert", async () => {
    const guestCart = { id: "guest-cart", sessionId: "sess-1", userId: null };
    const userCart = { id: "user-cart", sessionId: "old", userId: "u1" };
    const guestItem = {
      id: "gi-1",
      cartId: "guest-cart",
      productId: "p1",
      color: "red",
      size: "M",
      quantity: 3,
    };

    const upsertReturning = vi.fn(async () => [
      { id: "ci-1", quantity: 3, cartId: "user-cart", productId: "p1" },
    ]);
    const tx = {
      query: {
        carts: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce(guestCart)
            .mockResolvedValueOnce(userCart),
        },
        cartItems: {
          findMany: vi.fn(async () => [guestItem]),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(async () => undefined),
          onConflictDoUpdate: vi.fn(() => ({ returning: upsertReturning })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn(async () => []) })),
      })),
    };
    vi.mocked(db.transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (cb: any) => cb(tx),
    );

    const res = await POST(mergeRequest());
    expect(res.status).toBe(200);
    // one insert call for the user cart, one for the merged item upsert
    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(upsertReturning).toHaveBeenCalledTimes(1);
  });
});
