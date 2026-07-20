import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { chain, jsonRequest } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/media/media-handle", () => ({
  deleteFiles: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { query: {}, delete: vi.fn() },
}));

import { DELETE, GET } from "@/app/api/products/[id]/route";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { deleteFiles } from "@/lib/media/media-handle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

const PRODUCT_ID = "77777777-7777-4777-8777-777777777777";

function getRequest() {
  return jsonRequest(
    `http://test/api/products/${PRODUCT_ID}`,
    "GET",
  ) as unknown as NextRequest;
}

function deleteRequest() {
  return jsonRequest(
    `http://test/api/products/${PRODUCT_ID}`,
    "DELETE",
  ) as unknown as NextRequest;
}

describe("GET /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminCheck).mockResolvedValue(false);
  });

  it("returns 404 when the product does not exist", async () => {
    dbAny.query.products = { findFirst: vi.fn(async () => undefined) };
    const res = await GET(getRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 for an inactive product when the caller is not an admin", async () => {
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID, isActive: false })),
    };
    const res = await GET(getRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns the product for an admin even when inactive", async () => {
    vi.mocked(adminCheck).mockResolvedValue(true);
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID, isActive: false })),
    };
    const res = await GET(getRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(200);
  });

  it("returns an active product for a non-admin caller", async () => {
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID, isActive: true })),
    };
    const res = await GET(getRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminCheck).mockResolvedValue(true);
    dbAny.delete.mockImplementation(() => chain());
  });

  it("returns 403 when the caller is not an admin", async () => {
    vi.mocked(adminCheck).mockResolvedValue(false);
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when the product does not exist", async () => {
    dbAny.query.products = { findFirst: vi.fn(async () => undefined) };
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("blocks deletion when the product has existing order items", async () => {
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID, productMedia: [] })),
    };
    dbAny.query.orderItems = {
      findFirst: vi.fn(async () => ({ id: "oi-1" })),
    };
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(400);
    expect(dbAny.delete).not.toHaveBeenCalled();
  });

  it("deletes the product and its media files", async () => {
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({
        id: PRODUCT_ID,
        productMedia: [{ path: "gallery-1" }, { path: "fabric-1" }],
      })),
    };
    dbAny.query.orderItems = { findFirst: vi.fn(async () => undefined) };
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(200);
    expect(dbAny.delete).toHaveBeenCalledTimes(1);
    expect(deleteFiles).toHaveBeenCalledWith(["gallery-1", "fabric-1"]);
  });

  it("does not call deleteFiles when the product has no media", async () => {
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID, productMedia: [] })),
    };
    dbAny.query.orderItems = { findFirst: vi.fn(async () => undefined) };
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    });
    expect(res.status).toBe(200);
    expect(deleteFiles).not.toHaveBeenCalled();
  });
});
