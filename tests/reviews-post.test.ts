import { beforeEach, describe, expect, it, vi } from "vitest";
import { chain, jsonRequest } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { query: {}, select: vi.fn(), insert: vi.fn() },
}));

import { POST } from "@/app/api/products/[id]/reviews/route";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

const PRODUCT_ID = "33333333-3333-4333-8333-333333333333";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function postReview(body: unknown) {
  return POST(
    jsonRequest(`http://test/api/products/${PRODUCT_ID}/reviews`, "POST", body),
    { params: Promise.resolve({ id: PRODUCT_ID }) },
  );
}

describe("POST /api/products/[id]/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as any);
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID, isActive: true })),
    };
    dbAny.query.reviews = { findFirst: vi.fn(async () => undefined) };
    // purchase-eligibility query resolves to one matching order
    dbAny.select.mockImplementation(() => chain([{ id: "order-1" }]));
    dbAny.insert.mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => [{ id: "rev-1", rating: 5 }]),
      })),
    }));
  });

  it("rejects imagesPath entries outside the user's own review folder", async () => {
    const res = await postReview({
      rating: 5,
      imagesUrl: ["https://media.test/products/p1/images/a.webp"],
      imagesPath: ["/root/media/products/p1/images/a.webp"],
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/imagesPath/);
    expect(dbAny.insert).not.toHaveBeenCalled();
  });

  it("accepts imagesPath entries inside the user's own review folder", async () => {
    const res = await postReview({
      rating: 5,
      imagesUrl: ["https://media.test/reviews/u1/p/a.webp"],
      imagesPath: [`/root/media/reviews/u1/${PRODUCT_ID}/images/a.webp`],
    });
    expect(res.status).toBe(201);
  });

  it("returns 409 when a concurrent duplicate insert hits the unique constraint", async () => {
    dbAny.insert.mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => {
          throw Object.assign(new Error("duplicate key"), {
            cause: { code: "23505" },
          });
        }),
      })),
    }));
    const res = await postReview({ rating: 4 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toBe("You have already reviewed this product");
  });

  it("still returns 403 when the user never purchased the product", async () => {
    dbAny.select.mockImplementation(() => chain([]));
    const res = await postReview({ rating: 4 });
    expect(res.status).toBe(403);
  });
});
