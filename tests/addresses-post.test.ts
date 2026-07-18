import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonRequest } from "./helpers";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  adminCheck: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn() },
}));

import { POST } from "@/app/api/addresses/route";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

const addressBody = {
  label: "Home",
  fullName: "Test User",
  phone: "9999999999",
  addressLine1: "1 Test Street",
  city: "Mumbai",
  state: "MH",
  pincode: "400001",
};

function setupTx() {
  const whereMock = vi.fn(async () => undefined);
  const setMock = vi.fn(() => ({ where: whereMock }));
  const updateMock = vi.fn(() => ({ set: setMock }));
  const returningMock = vi.fn(async () => [{ id: "addr-1", ...addressBody }]);
  const valuesMock = vi.fn(() => ({ returning: returningMock }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  const tx = { update: updateMock, insert: insertMock };
  vi.mocked(db.transaction).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (cb: any) => cb(tx),
  );
  return { updateMock, insertMock };
}

describe("POST /api/addresses default-address handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as any);
  });

  it("does NOT unset other defaults when the new address is not default", async () => {
    const { updateMock } = setupTx();
    const res = await POST(
      jsonRequest("http://test/api/addresses", "POST", {
        ...addressBody,
        isDefault: false,
      }),
    );
    expect(res.status).toBe(201);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("unsets other defaults when the new address is default", async () => {
    const { updateMock, insertMock } = setupTx();
    const res = await POST(
      jsonRequest("http://test/api/addresses", "POST", {
        ...addressBody,
        isDefault: true,
      }),
    );
    expect(res.status).toBe(201);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
