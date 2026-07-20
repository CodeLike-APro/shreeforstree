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
  db: { query: {}, transaction: vi.fn(), select: vi.fn() },
}));

import { PATCH } from "@/app/api/products/[id]/route";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { deleteFiles } from "@/lib/media/media-handle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

const PRODUCT_ID = "55555555-5555-4555-8555-555555555555";

function patchProduct(body: unknown) {
  return PATCH(
    jsonRequest(
      `http://test/api/products/${PRODUCT_ID}`,
      "PATCH",
      body,
    ) as unknown as NextRequest,
    { params: Promise.resolve({ id: PRODUCT_ID }) },
  );
}

const baseProductMedia = [
  {
    path: "gallery-1",
    url: "url-gallery-1",
    type: "image",
    isHero: false,
    isFabricSwatch: false,
  },
  {
    path: "gallery-2",
    url: "url-gallery-2",
    type: "image",
    isHero: false,
    isFabricSwatch: false,
  },
  {
    path: "fabric-1",
    url: "url-fabric-1",
    type: "image",
    isHero: false,
    isFabricSwatch: true,
  },
  {
    path: "fabric-2",
    url: "url-fabric-2",
    type: "image",
    isHero: false,
    isFabricSwatch: true,
  },
  {
    path: "hero-1",
    url: "url-hero-1",
    type: "image",
    isHero: true,
    isFabricSwatch: false,
  },
];

function baseProduct() {
  return {
    id: PRODUCT_ID,
    productMedia: baseProductMedia,
    categories: [],
  };
}

function mockTx() {
  const insertCalls: { values: unknown }[] = [];
  const deleteCalls: { where: unknown }[] = [];
  const updateCalls: { set: unknown; where: unknown }[] = [];

  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn((values: unknown) => {
        insertCalls.push({ values });
        return chain();
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn((where: unknown) => {
        deleteCalls.push({ where });
        return chain();
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((set: unknown) => ({
        where: vi.fn((where: unknown) => {
          updateCalls.push({ set, where });
          return chain();
        }),
      })),
    })),
  };

  return { tx, insertCalls, deleteCalls, updateCalls };
}

describe("PATCH /api/products/[id]", () => {
  let txHelpers: ReturnType<typeof mockTx>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminCheck).mockResolvedValue(true);

    dbAny.query.products = {
      findFirst: vi.fn(async () => baseProduct()),
    };

    txHelpers = mockTx();
    dbAny.transaction.mockImplementation(async (cb: any) => cb(txHelpers.tx));
    // order-item reference lookup for storage cleanup: nothing referenced by default
    dbAny.select.mockImplementation(() => chain([]));
  });

  it("returns 403 when the caller is not an admin", async () => {
    vi.mocked(adminCheck).mockResolvedValue(false);
    const res = await patchProduct({ fabric: "silk" });
    expect(res.status).toBe(403);
  });

  it("returns 404 when the product does not exist", async () => {
    dbAny.query.products.findFirst = vi.fn(async () => undefined);
    const res = await patchProduct({ fabric: "silk" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid input", async () => {
    const res = await patchProduct({ fabric: "silk", price: "not-a-price" });
    expect(res.status).toBe(400);
  });

  it("returns 409 when the new title's slug collides with another product", async () => {
    dbAny.query.products.findFirst = vi
      .fn()
      .mockResolvedValueOnce(baseProduct())
      .mockResolvedValueOnce({ id: "other-product" });

    const res = await patchProduct({ fabric: "silk", title: "New Title" });
    expect(res.status).toBe(409);
  });

  it("does not touch fabric swatches when only gallery media is patched", async () => {
    const res = await patchProduct({
      fabric: "silk",
      media: [
        { url: "url-gallery-1", path: "gallery-1", type: "image", sortOrder: 0 },
      ],
    });

    expect(res.status).toBe(200);
    // gallery-2 was dropped from the incoming list -> deleted
    expect(txHelpers.deleteCalls).toHaveLength(1);
    // regression check: fabric-1/fabric-2 must survive a gallery-only patch
    expect(deleteFiles).toHaveBeenCalledWith(["gallery-2"]);
  });

  it("reconciles fabric swatches: inserts new, reorders kept, deletes removed", async () => {
    const res = await patchProduct({
      fabric: "silk",
      fabricMedia: [
        { url: "url-fabric-1", path: "fabric-1", type: "image", sortOrder: 1 },
        { url: "url-fabric-3", path: "fabric-3", type: "image", sortOrder: 0 },
      ],
    });

    expect(res.status).toBe(200);

    // fabric-3 is new
    expect(txHelpers.insertCalls).toHaveLength(1);
    expect(txHelpers.insertCalls[0].values).toEqual([
      expect.objectContaining({ path: "fabric-3", isFabricSwatch: true }),
    ]);

    // fabric-1 kept, sortOrder changed to 1 (alongside the unrelated product-row update)
    const sortOrderUpdate = txHelpers.updateCalls.find(
      (c) =>
        typeof c.set === "object" &&
        c.set !== null &&
        "sortOrder" in (c.set as Record<string, unknown>),
    );
    expect(sortOrderUpdate?.set).toEqual({ sortOrder: 1 });

    // fabric-2 dropped from the incoming list -> deleted
    expect(txHelpers.deleteCalls).toHaveLength(1);
    expect(deleteFiles).toHaveBeenCalledWith(["fabric-2"]);
  });

  it("skips storage deletion for a path still referenced by an order item", async () => {
    dbAny.select.mockImplementation(() => chain([{ url: "url-fabric-2" }]));

    const res = await patchProduct({
      fabric: "silk",
      fabricMedia: [
        { url: "url-fabric-1", path: "fabric-1", type: "image", sortOrder: 0 },
      ],
    });

    expect(res.status).toBe(200);
    // fabric-2 is dropped from the DB, but its file must not be removed from storage
    expect(deleteFiles).toHaveBeenCalledWith([]);
  });

  it("leaves gallery and fabric media untouched when neither field is sent", async () => {
    const res = await patchProduct({ fabric: "silk", isActive: false });

    expect(res.status).toBe(200);
    expect(txHelpers.deleteCalls).toHaveLength(0);
    expect(deleteFiles).not.toHaveBeenCalled();
  });
});
