import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonRequest } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { query: {}, update: vi.fn() },
}));

import { PATCH } from "@/app/api/orders/[id]/status/route";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";

const ORDER_ID = "22222222-2222-4222-8222-222222222222";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function patchStatus(orderStatus: string) {
  return PATCH(
    jsonRequest(`http://test/api/orders/${ORDER_ID}/status`, "PATCH", {
      orderStatus,
    }),
    { params: Promise.resolve({ id: ORDER_ID }) },
  );
}

function mockUpdateReturning(rows: unknown[]) {
  const returningMock = vi.fn(async () => rows);
  const whereMock = vi.fn(() => ({ returning: returningMock }));
  const setMock = vi.fn(() => ({ where: whereMock }));
  dbAny.update.mockImplementation(() => ({ set: setMock }));
  return { setMock, whereMock };
}

describe("PATCH /api/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminCheck).mockResolvedValue(true);
    dbAny.query.orders = {
      findFirst: vi.fn(async () => ({
        id: ORDER_ID,
        orderStatus: "placed",
        paymentStatus: "success",
      })),
    };
  });

  it("rejects an invalid transition", async () => {
    mockUpdateReturning([]);
    const res = await patchStatus("delivered");
    expect(res.status).toBe(400);
    expect(dbAny.update).not.toHaveBeenCalled();
  });

  it("returns 409 when the status changed concurrently (no row matched)", async () => {
    mockUpdateReturning([]);
    const res = await patchStatus("confirmed");
    expect(res.status).toBe(409);
  });

  it("applies a valid transition and flags refunds for paid cancellations", async () => {
    const { setMock } = mockUpdateReturning([
      { id: ORDER_ID, orderStatus: "cancelled", refundRequired: true },
    ]);
    const res = await patchStatus("cancelled");
    expect(res.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith({
      orderStatus: "cancelled",
      refundRequired: true,
    });
  });
});
