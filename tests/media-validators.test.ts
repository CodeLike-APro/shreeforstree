import { describe, expect, it } from "vitest";
import {
  adminMediaUploadSchema,
  mediaUploadSchema,
} from "@/lib/validators/media.validators";

const PRODUCT_ID = "44444444-4444-4444-8444-444444444444";

describe("mediaUploadSchema", () => {
  it("rejects an unknown type", async () => {
    const result = await mediaUploadSchema.safeParseAsync({
      type: "product-hero",
    });
    expect(result.success).toBe(false);
  });

  it("does not require productId for avatar uploads", async () => {
    const result = await mediaUploadSchema.safeParseAsync({
      type: "avatar",
    });
    expect(result.success).toBe(true);
  });

  it("requires productId for review uploads", async () => {
    const result = await mediaUploadSchema.safeParseAsync({
      type: "review",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid productId for review uploads", async () => {
    const result = await mediaUploadSchema.safeParseAsync({
      type: "review",
      productId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts review uploads with a valid productId", async () => {
    const result = await mediaUploadSchema.safeParseAsync({
      type: "review",
      productId: PRODUCT_ID,
    });
    expect(result.success).toBe(true);
  });
});

describe("adminMediaUploadSchema", () => {
  it("requires categorySlug for category-size-chart uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "category-size-chart",
    });
    expect(result.success).toBe(false);
  });

  it("does not require productId for category-size-chart uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "category-size-chart",
      categorySlug: "some-category",
    });
    expect(result.success).toBe(true);
  });

  it("requires categorySlug for category uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "category",
    });
    expect(result.success).toBe(false);
  });

  it("does not require productId for category uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "category",
      categorySlug: "some-category",
    });
    expect(result.success).toBe(true);
  });

  it("requires productId for product uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "product-gallery",
    });
    expect(result.success).toBe(false);
  });

  it("accepts keepCount for product-gallery uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "product-gallery",
      productId: PRODUCT_ID,
      keepCount: "3",
    });
    expect(result.success).toBe(true);
  });

  it("accepts keepCount for product-fabric uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "product-fabric",
      productId: PRODUCT_ID,
      keepCount: "2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects keepCount for product-hero uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "product-hero",
      productId: PRODUCT_ID,
      keepCount: "1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects keepCount for category uploads", async () => {
    const result = await adminMediaUploadSchema.safeParseAsync({
      type: "category",
      categorySlug: "some-category",
      keepCount: "1",
    });
    expect(result.success).toBe(false);
  });
});
