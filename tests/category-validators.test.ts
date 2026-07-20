import { describe, expect, it } from "vitest";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validators/category.validators";

describe("createCategorySchema", () => {
  it("rejects a missing name", async () => {
    const result = await createCategorySchema.safeParseAsync({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", async () => {
    const result = await createCategorySchema.safeParseAsync({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty description when provided", async () => {
    const result = await createCategorySchema.safeParseAsync({
      name: "Dresses",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a name on its own", async () => {
    const result = await createCategorySchema.safeParseAsync({
      name: "Dresses",
    });
    expect(result.success).toBe(true);
  });

  it("accepts name, description and isActive together", async () => {
    const result = await createCategorySchema.safeParseAsync({
      name: "Dresses",
      description: "Elegant evening wear",
      isActive: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateCategorySchema", () => {
  it("rejects categoryImageUrl without a matching categoryImagePath", async () => {
    const result = await updateCategorySchema.safeParseAsync({
      categoryImageUrl: "https://media.test/categories/c1/a.webp",
    });
    expect(result.success).toBe(false);
  });

  it("rejects sizeChartImageUrl without a matching sizeChartImagePath", async () => {
    const result = await updateCategorySchema.safeParseAsync({
      sizeChartImageUrl: "https://media.test/categories/c1/size.webp",
    });
    expect(result.success).toBe(false);
  });

  it("rejects sizeChartImagePath without a matching sizeChartImageUrl", async () => {
    const result = await updateCategorySchema.safeParseAsync({
      sizeChartImagePath: "/root/media/categories/c1/size.webp",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matched categoryImage and sizeChartImage pairs together", async () => {
    const result = await updateCategorySchema.safeParseAsync({
      categoryImageUrl: "https://media.test/categories/c1/a.webp",
      categoryImagePath: "/root/media/categories/c1/a.webp",
      sizeChartImageUrl: "https://media.test/categories/c1/size.webp",
      sizeChartImagePath: "/root/media/categories/c1/size.webp",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", async () => {
    const result = await updateCategorySchema.safeParseAsync({});
    expect(result.success).toBe(false);
  });
});
