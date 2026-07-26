import { describe, expect, it } from "vitest";
import { isOwnedMediaPath } from "@/lib/media/path-guard";

describe("isOwnedMediaPath", () => {
  it("accepts a path inside the scoped folder (with MEDIA_REMOTE_ROOT prefix)", () => {
    expect(
      isOwnedMediaPath("/root/media/avatars/u1/123-abc.webp", "avatars/u1"),
    ).toBe(true);
  });

  it("accepts a relative path starting with the scope", () => {
    expect(isOwnedMediaPath("avatars/u1/123-abc.webp", "avatars/u1")).toBe(
      true,
    );
  });

  it("rejects a path pointing at another user's folder", () => {
    expect(
      isOwnedMediaPath("/root/media/avatars/u2/123-abc.webp", "avatars/u1"),
    ).toBe(false);
  });

  it("rejects a path pointing at product media", () => {
    expect(
      isOwnedMediaPath("/root/media/products/p1/images/a.webp", "avatars/u1"),
    ).toBe(false);
  });

  it("rejects traversal attempts", () => {
    expect(
      isOwnedMediaPath(
        "/root/media/avatars/u1/../../products/a.webp",
        "avatars/u1",
      ),
    ).toBe(false);
  });

  it("rejects a user id that is a prefix of another (u1 vs u12)", () => {
    expect(
      isOwnedMediaPath("/root/media/avatars/u12/a.webp", "avatars/u1"),
    ).toBe(false);
  });

  it("scopes review paths to user + product", () => {
    expect(
      isOwnedMediaPath(
        "/root/media/reviews/u1/p1/images/a.webp",
        "reviews/u1/p1",
      ),
    ).toBe(true);
    expect(
      isOwnedMediaPath(
        "/root/media/reviews/u1/p2/images/a.webp",
        "reviews/u1/p1",
      ),
    ).toBe(false);
  });
});
