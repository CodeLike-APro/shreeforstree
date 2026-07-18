import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonRequest } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/media/media-handle", () => ({
  deleteFile: vi.fn(),
  deleteFiles: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { query: {}, update: vi.fn(), transaction: vi.fn() },
}));

import { PATCH } from "@/app/api/users/[id]/route";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function patchUser(id: string, body: unknown) {
  return PATCH(jsonRequest(`http://test/api/users/${id}`, "PATCH", body), {
    params: Promise.resolve({ id }),
  });
}

describe("PATCH /api/users/[id] imagePath guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", role: "user" } as any);
    dbAny.query.user = {
      findFirst: vi.fn(async () => ({ id: "u1", deletedAt: null })),
    };
    dbAny.update.mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [{ id: "u1" }]),
        })),
      })),
    }));
  });

  it("rejects an imagePath outside the user's avatar folder", async () => {
    const res = await patchUser("u1", {
      image: "https://media.test/products/p1/images/a.webp",
      imagePath: "/root/media/products/p1/images/a.webp",
    });
    expect(res.status).toBe(400);
    expect(dbAny.update).not.toHaveBeenCalled();
  });

  it("rejects an imagePath pointing at another user's avatar", async () => {
    const res = await patchUser("u1", {
      image: "https://media.test/avatars/u2/a.webp",
      imagePath: "/root/media/avatars/u2/a.webp",
    });
    expect(res.status).toBe(400);
  });

  it("accepts an imagePath inside the user's own avatar folder", async () => {
    const res = await patchUser("u1", {
      image: "https://media.test/avatars/u1/a.webp",
      imagePath: "/root/media/avatars/u1/a.webp",
    });
    expect(res.status).toBe(200);
    expect(dbAny.update).toHaveBeenCalledTimes(1);
  });
});
