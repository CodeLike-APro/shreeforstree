import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { chain } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/media/media-handle", () => ({
  deleteFiles: vi.fn(),
  detectMediaType: vi.fn(async () => ({
    isImage: true,
    isVideo: false,
    mime: "image/webp",
  })),
  uploadFiles: vi.fn(),
  uploadSingleFile: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { query: {}, select: vi.fn(), update: vi.fn(), insert: vi.fn() },
}));

import { POST } from "@/app/api/media/admin/upload/route";
import { adminCheck } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  deleteFiles,
  detectMediaType,
  uploadFiles,
  uploadSingleFile,
} from "@/lib/media/media-handle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

const PRODUCT_ID = "66666666-6666-4666-8666-666666666666";

function makeImageFile(name = "a.webp") {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/webp" });
}

function uploadRequest(fields: Record<string, string>, files: File[]) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  for (const file of files) fd.append("files", file);
  return new Request("http://test/api/media/admin/upload", {
    method: "POST",
    body: fd,
  }) as unknown as NextRequest;
}

function mockExistingCount(n: number) {
  dbAny.select.mockImplementation(() => chain([{ count: n }]));
}

function mockUpdateReturning(rows: unknown[]) {
  const returningMock = vi.fn(async () => rows);
  const whereMock = vi.fn(() => ({ returning: returningMock }));
  const setMock = vi.fn(() => ({ where: whereMock }));
  dbAny.update.mockImplementation(() => ({ set: setMock }));
  return { setMock };
}

function mockInsertReturning(rows: unknown[]) {
  const returningMock = vi.fn(async () => rows);
  const valuesMock = vi.fn(() => ({ returning: returningMock }));
  dbAny.insert.mockImplementation(() => ({ values: valuesMock }));
  return { valuesMock };
}

describe("POST /api/media/admin/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminCheck).mockResolvedValue(true);
    dbAny.query.products = {
      findFirst: vi.fn(async () => ({ id: PRODUCT_ID })),
    };
    dbAny.query.categories = {
      findFirst: vi.fn(async () => ({
        id: "cat-1",
        categoryImagePath: null,
        sizeChartImagePath: null,
      })),
    };
    dbAny.query.productMedia = {
      findFirst: vi.fn(async () => undefined),
    };
    vi.mocked(uploadFiles).mockResolvedValue([
      {
        publicUrl: "https://media.test/products/p1/fabric/images/a.webp",
        path: "/root/media/products/p1/fabric/images/a.webp",
        fileName: "a.webp",
        mime: "image/webp",
        type: "image",
      },
    ]);
    vi.mocked(uploadSingleFile).mockResolvedValue({
      publicUrl: "https://media.test/categories/cat-1/size-chart-image/a.webp",
      path: "/root/media/categories/cat-1/size-chart-image/a.webp",
      fileName: "a.webp",
      mime: "image/webp",
      type: "image",
    });
  });

  it("returns 403 when the caller is not an admin", async () => {
    vi.mocked(adminCheck).mockResolvedValue(false);
    const res = await POST(
      uploadRequest({ type: "product-fabric", productId: PRODUCT_ID }, [
        makeImageFile(),
      ]),
    );
    expect(res.status).toBe(403);
  });

  it("requires categorySlug for category-size-chart uploads", async () => {
    const res = await POST(
      uploadRequest({ type: "category-size-chart" }, [makeImageFile()]),
    );
    expect(res.status).toBe(400);
  });

  it("does not require productId for category-size-chart uploads", async () => {
    mockUpdateReturning([
      {
        sizeChartImageUrl: "https://media.test/x.webp",
        sizeChartImagePath: "/x",
      },
    ]);
    const res = await POST(
      uploadRequest({ type: "category-size-chart", categorySlug: "dresses" }, [
        makeImageFile(),
      ]),
    );
    expect(res.status).toBe(200);
  });

  it("rejects keepCount on a type that doesn't support a replace flow", async () => {
    const res = await POST(
      uploadRequest(
        {
          type: "category-size-chart",
          categorySlug: "dresses",
          keepCount: "1",
        },
        [makeImageFile()],
      ),
    );
    expect(res.status).toBe(400);
  });

  describe("product-fabric", () => {
    it("rejects an upload that would exceed the max when keepCount is omitted", async () => {
      mockExistingCount(4);
      const res = await POST(
        uploadRequest({ type: "product-fabric", productId: PRODUCT_ID }, [
          makeImageFile("a.webp"),
          makeImageFile("b.webp"),
        ]),
      );
      expect(res.status).toBe(400);
      expect(uploadFiles).not.toHaveBeenCalled();
    });

    it("allows a replace flow through when keepCount accounts for removals", async () => {
      mockExistingCount(4);
      const res = await POST(
        uploadRequest(
          {
            type: "product-fabric",
            productId: PRODUCT_ID,
            keepCount: "2",
          },
          [makeImageFile("a.webp"), makeImageFile("b.webp")],
        ),
      );
      expect(res.status).toBe(200);
      expect(uploadFiles).toHaveBeenCalledTimes(1);
    });

    it("clamps an inflated keepCount to the actual existing count", async () => {
      mockExistingCount(1);
      // claims to be keeping 4, but only 1 exists — should not let 4 new files through
      const res = await POST(
        uploadRequest(
          {
            type: "product-fabric",
            productId: PRODUCT_ID,
            keepCount: "4",
          },
          [
            makeImageFile("a.webp"),
            makeImageFile("b.webp"),
            makeImageFile("c.webp"),
            makeImageFile("d.webp"),
          ],
        ),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("product-gallery", () => {
    it("rejects an upload that would exceed the max when keepCount is omitted", async () => {
      mockExistingCount(10);
      const res = await POST(
        uploadRequest({ type: "product-gallery", productId: PRODUCT_ID }, [
          makeImageFile(),
        ]),
      );
      expect(res.status).toBe(400);
      expect(uploadFiles).not.toHaveBeenCalled();
    });

    it("allows a replace flow through when keepCount accounts for removals", async () => {
      mockExistingCount(10);
      const res = await POST(
        uploadRequest(
          {
            type: "product-gallery",
            productId: PRODUCT_ID,
            keepCount: "8",
          },
          [makeImageFile("a.webp"), makeImageFile("b.webp")],
        ),
      );
      expect(res.status).toBe(200);
      expect(uploadFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe("product-hero", () => {
    it("rejects non-image files", async () => {
      vi.mocked(detectMediaType).mockResolvedValueOnce({
        isImage: false,
        isVideo: true,
        mime: "video/mp4",
      });
      const res = await POST(
        uploadRequest({ type: "product-hero", productId: PRODUCT_ID }, [
          makeImageFile(),
        ]),
      );
      expect(res.status).toBe(400);
    });

    it("inserts a new hero row when the product has no existing hero image", async () => {
      dbAny.query.productMedia = { findFirst: vi.fn(async () => undefined) };
      const { valuesMock } = mockInsertReturning([
        {
          path: "/root/media/products/p1/hero-image/new.webp",
          url: "u",
          type: "image",
        },
      ]);
      vi.mocked(uploadSingleFile).mockResolvedValue({
        publicUrl: "https://media.test/products/p1/hero-image/new.webp",
        path: "/root/media/products/p1/hero-image/new.webp",
        fileName: "new.webp",
        mime: "image/webp",
        type: "image",
      });

      const res = await POST(
        uploadRequest({ type: "product-hero", productId: PRODUCT_ID }, [
          makeImageFile(),
        ]),
      );

      expect(res.status).toBe(200);
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({ isHero: true, productId: PRODUCT_ID }),
      );
      expect(deleteFiles).not.toHaveBeenCalled();
    });

    it("replaces an existing hero image and deletes the old file", async () => {
      dbAny.query.productMedia = {
        findFirst: vi.fn(async () => ({
          id: "pm-1",
          path: "/root/media/products/p1/hero-image/old.webp",
        })),
      };
      mockUpdateReturning([
        {
          path: "/root/media/products/p1/hero-image/new.webp",
          url: "u",
          type: "image",
        },
      ]);
      vi.mocked(uploadSingleFile).mockResolvedValue({
        publicUrl: "https://media.test/products/p1/hero-image/new.webp",
        path: "/root/media/products/p1/hero-image/new.webp",
        fileName: "new.webp",
        mime: "image/webp",
        type: "image",
      });

      const res = await POST(
        uploadRequest({ type: "product-hero", productId: PRODUCT_ID }, [
          makeImageFile(),
        ]),
      );

      expect(res.status).toBe(200);
      expect(deleteFiles).toHaveBeenCalledWith([
        "/root/media/products/p1/hero-image/old.webp",
      ]);
    });

    it("does not delete the old file when the new upload lands at the same path", async () => {
      const samePath = "/root/media/products/p1/hero-image/same.webp";
      dbAny.query.productMedia = {
        findFirst: vi.fn(async () => ({ id: "pm-1", path: samePath })),
      };
      mockUpdateReturning([{ path: samePath, url: "u", type: "image" }]);
      vi.mocked(uploadSingleFile).mockResolvedValue({
        publicUrl: "https://media.test/x.webp",
        path: samePath,
        fileName: "same.webp",
        mime: "image/webp",
        type: "image",
      });

      const res = await POST(
        uploadRequest({ type: "product-hero", productId: PRODUCT_ID }, [
          makeImageFile(),
        ]),
      );

      expect(res.status).toBe(200);
      expect(deleteFiles).not.toHaveBeenCalled();
    });
  });

  describe("category (image)", () => {
    it("rejects non-image files", async () => {
      vi.mocked(detectMediaType).mockResolvedValueOnce({
        isImage: false,
        isVideo: true,
        mime: "video/mp4",
      });
      const res = await POST(
        uploadRequest({ type: "category", categorySlug: "dresses" }, [
          makeImageFile(),
        ]),
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when the category does not exist", async () => {
      dbAny.query.categories = { findFirst: vi.fn(async () => undefined) };
      const res = await POST(
        uploadRequest({ type: "category", categorySlug: "missing" }, [
          makeImageFile(),
        ]),
      );
      expect(res.status).toBe(404);
    });

    it("uploads and updates without deleting anything when no image exists yet", async () => {
      dbAny.query.categories = {
        findFirst: vi.fn(async () => ({
          id: "cat-1",
          categoryImagePath: null,
        })),
      };
      mockUpdateReturning([
        {
          categoryImageUrl: "https://media.test/x.webp",
          categoryImagePath: "/x",
        },
      ]);

      const res = await POST(
        uploadRequest({ type: "category", categorySlug: "dresses" }, [
          makeImageFile(),
        ]),
      );

      expect(res.status).toBe(200);
      expect(deleteFiles).not.toHaveBeenCalled();
    });

    it("deletes the old image before uploading the replacement", async () => {
      dbAny.query.categories = {
        findFirst: vi.fn(async () => ({
          id: "cat-1",
          categoryImagePath:
            "/root/media/categories/cat-1/category-image/old.webp",
        })),
      };
      mockUpdateReturning([
        {
          categoryImageUrl: "https://media.test/x.webp",
          categoryImagePath: "/x",
        },
      ]);

      const res = await POST(
        uploadRequest({ type: "category", categorySlug: "dresses" }, [
          makeImageFile(),
        ]),
      );

      expect(res.status).toBe(200);
      expect(deleteFiles).toHaveBeenCalledWith([
        "/root/media/categories/cat-1/category-image/old.webp",
      ]);
    });

    it("still succeeds when deleting the old image throws", async () => {
      dbAny.query.categories = {
        findFirst: vi.fn(async () => ({
          id: "cat-1",
          categoryImagePath:
            "/root/media/categories/cat-1/category-image/old.webp",
        })),
      };
      vi.mocked(deleteFiles).mockRejectedValueOnce(new Error("SFTP down"));
      mockUpdateReturning([
        {
          categoryImageUrl: "https://media.test/x.webp",
          categoryImagePath: "/x",
        },
      ]);

      const res = await POST(
        uploadRequest({ type: "category", categorySlug: "dresses" }, [
          makeImageFile(),
        ]),
      );

      expect(res.status).toBe(200);
    });
  });
});
