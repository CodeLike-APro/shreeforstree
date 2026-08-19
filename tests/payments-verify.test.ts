import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { jsonRequest } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/razorpay", () => ({
  razorpay: { payments: { fetch: vi.fn(async () => ({ method: "upi" })) } },
}));
vi.mock("@/lib/db", () => ({
  db: { query: {}, update: vi.fn(), transaction: vi.fn() },
}));

import { POST } from "@/app/api/payments/verify/route";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

describe("POST /api/payments/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as any);
    dbAny.query.orders = {
      findFirst: vi.fn(async () => ({
        id: ORDER_ID,
        userId: "u1",
        totalAmount: "500.00",
      })),
    };
  });

  it("rejects a payment row belonging to a different order BEFORE any write", async () => {
    dbAny.query.payments = {
      findFirst: vi.fn(async () => ({
        id: "pay-1",
        orderId: "some-other-order",
        razorpayOrderId: "rzp_1",
        status: "pending",
      })),
    };

    const res = await POST(
      jsonRequest("http://test/api/payments/verify", "POST", {
        orderId: ORDER_ID,
        razorpayOrderId: "rzp_1",
        razorpayPaymentId: "pay_x",
        razorpaySignature: "invalid-signature",
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Payment does not belong to this order");
    // the critical regression: the foreign payment row must NOT be mutated
    expect(dbAny.update).not.toHaveBeenCalled();
    expect(dbAny.transaction).not.toHaveBeenCalled();
  });

  it("marks the payment failed on a bad signature for the caller's own payment", async () => {
    dbAny.query.payments = {
      findFirst: vi.fn(async () => ({
        id: "pay-1",
        orderId: ORDER_ID,
        razorpayOrderId: "rzp_1",
        status: "pending",
      })),
    };
    const whereMock = vi.fn(async () => undefined);
    const setMock = vi.fn(() => ({ where: whereMock }));
    dbAny.update.mockImplementation(() => ({ set: setMock }));

    const res = await POST(
      jsonRequest("http://test/api/payments/verify", "POST", {
        orderId: ORDER_ID,
        razorpayOrderId: "rzp_1",
        razorpayPaymentId: "pay_x",
        razorpaySignature: "invalid-signature",
      }),
    );

    expect(res.status).toBe(400);
    expect(setMock).toHaveBeenCalledWith({ status: "failed" });
  });

  it("verifies a valid signature and places the order", async () => {
    dbAny.query.payments = {
      findFirst: vi.fn(async () => ({
        id: "pay-1",
        orderId: ORDER_ID,
        razorpayOrderId: "rzp_1",
        status: "pending",
      })),
    };
    const validSignature = crypto
      .createHmac("sha256", "test-secret")
      .update("rzp_1|pay_x")
      .digest("hex");

    const txResult = {
      updatedPayment: { id: "pay-1", status: "success" },
      updatedOrder: { id: ORDER_ID, orderStatus: "placed" },
    };
    const tx = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(async () => [{ id: "x" }]),
          })),
        })),
      })),
    };
    dbAny.transaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (cb: any) => {
        await cb(tx);
        return txResult;
      },
    );

    const res = await POST(
      jsonRequest("http://test/api/payments/verify", "POST", {
        orderId: ORDER_ID,
        razorpayOrderId: "rzp_1",
        razorpayPaymentId: "pay_x",
        razorpaySignature: validSignature,
      }),
    );

    expect(res.status).toBe(200);
    expect(dbAny.transaction).toHaveBeenCalledTimes(1);
  });
});
