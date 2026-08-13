import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../../generated/prisma/client";

const mockTenantUpdate = vi.fn();
const mockStaffFindFirst = vi.fn();
const mockStaffUpdateMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockRequireOwnerScope = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: { update: (...args: unknown[]) => mockTenantUpdate(...args) },
    staff: {
      findFirst: (...args: unknown[]) => mockStaffFindFirst(...args),
      updateMany: (...args: unknown[]) => mockStaffUpdateMany(...args),
    },
    user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
  },
}));

vi.mock("@/lib/tenant-scope", () => ({
  requireOwnerScope: (...args: unknown[]) => mockRequireOwnerScope(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { linkStaffEmail, updateTenantSettings, unlinkStaffEmail } from "../../app/(dashboard)/settings/actions";

const SCOPE = { tenantId: "tenant-1", slug: "demo" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireOwnerScope.mockResolvedValue(SCOPE);
});

function p2002() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint", {
    code: "P2002",
    clientVersion: "5.0.0",
  });
}

describe("updateTenantSettings", () => {
  it("rejects invalid input via zod", async () => {
    await expect(
      updateTenantSettings({ name: "", businessType: "SALON", timezone: "Asia/Ho_Chi_Minh", confirmMode: "AUTO" }),
    ).resolves.toEqual({ ok: false, error: "Vui lòng nhập tên cơ sở." });
    expect(mockTenantUpdate).not.toHaveBeenCalled();
  });

  it("updates the tenant scoped to the session tenantId and revalidates", async () => {
    mockTenantUpdate.mockResolvedValueOnce({ id: "tenant-1" });
    await expect(
      updateTenantSettings({ name: "Salon Mới", businessType: "SPA", timezone: "Asia/Bangkok", confirmMode: "MANUAL" }),
    ).resolves.toEqual({ ok: true });
    expect(mockTenantUpdate).toHaveBeenCalledWith({
      where: { id: "tenant-1" },
      data: { name: "Salon Mới", businessType: "SPA", timezone: "Asia/Bangkok", confirmMode: "MANUAL" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/booking/demo");
  });

  it("returns a friendly error when the session has no tenant", async () => {
    mockRequireOwnerScope.mockResolvedValueOnce(null);
    await expect(
      updateTenantSettings({ name: "X", businessType: "SALON", timezone: "Asia/Ho_Chi_Minh", confirmMode: "AUTO" }),
    ).resolves.toEqual({ ok: false, error: "Tài khoản chưa gắn với cơ sở." });
  });
});

describe("linkStaffEmail", () => {
  it("rejects a user from a DIFFERENT tenant", async () => {
    mockStaffFindFirst.mockResolvedValueOnce({ id: "staff-9" });
    mockUserFindUnique.mockResolvedValueOnce({ id: "u-other", tenantId: "tenant-2", role: "STAFF" });
    await expect(linkStaffEmail({ staffId: "staff-9", email: "x@demo.com" })).resolves.toEqual({
      ok: false,
      error: "Tài khoản này không thuộc cơ sở của bạn.",
    });
    expect(mockStaffUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects a non-STAFF role user in the same tenant", async () => {
    mockStaffFindFirst.mockResolvedValueOnce({ id: "staff-9" });
    mockUserFindUnique.mockResolvedValueOnce({ id: "u-owner", tenantId: "tenant-1", role: "OWNER" });
    await expect(linkStaffEmail({ staffId: "staff-9", email: "owner@demo.com" })).resolves.toEqual({
      ok: false,
      error: "Tài khoản này không phải là tài khoản nhân viên.",
    });
    expect(mockStaffUpdateMany).not.toHaveBeenCalled();
  });

  it("links a valid same-tenant STAFF user", async () => {
    mockStaffFindFirst.mockResolvedValueOnce({ id: "staff-9" });
    mockUserFindUnique.mockResolvedValueOnce({ id: "u-1", tenantId: "tenant-1", role: "STAFF" });
    mockStaffUpdateMany.mockResolvedValueOnce({ count: 1 });
    await expect(linkStaffEmail({ staffId: "staff-9", email: "staff@demo.com" })).resolves.toEqual({ ok: true });
    expect(mockStaffUpdateMany).toHaveBeenCalledWith({
      where: { id: "staff-9", tenantId: "tenant-1" },
      data: { userEmail: "staff@demo.com" },
    });
  });

  it("maps P2002 to a friendly already-linked error", async () => {
    mockStaffFindFirst.mockResolvedValueOnce({ id: "staff-9" });
    mockUserFindUnique.mockResolvedValueOnce({ id: "u-1", tenantId: "tenant-1", role: "STAFF" });
    mockStaffUpdateMany.mockRejectedValueOnce(p2002());
    await expect(linkStaffEmail({ staffId: "staff-9", email: "staff@demo.com" })).resolves.toEqual({
      ok: false,
      error: "Email này đã được liên kết với nhân viên khác trong cơ sở.",
    });
  });

  it("rejects an unknown email", async () => {
    mockStaffFindFirst.mockResolvedValueOnce({ id: "staff-9" });
    mockUserFindUnique.mockResolvedValueOnce(null);
    const res = await linkStaffEmail({ staffId: "staff-9", email: "nobody@demo.com" });
    expect(res.ok).toBe(false);
    expect(mockStaffUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects a staff row that is not in the session tenant", async () => {
    mockStaffFindFirst.mockResolvedValueOnce(null);
    await expect(linkStaffEmail({ staffId: "other", email: "staff@demo.com" })).resolves.toEqual({
      ok: false,
      error: "Nhân viên không tồn tại.",
    });
  });
});

describe("unlinkStaffEmail", () => {
  it("unlinks scoped to tenant and revalidates", async () => {
    mockStaffUpdateMany.mockResolvedValueOnce({ count: 1 });
    await expect(unlinkStaffEmail("staff-9")).resolves.toEqual({ ok: true });
    expect(mockStaffUpdateMany).toHaveBeenCalledWith({
      where: { id: "staff-9", tenantId: "tenant-1" },
      data: { userEmail: null },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("returns not-found when the staff is not in the session tenant", async () => {
    mockStaffUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(unlinkStaffEmail("staff-9")).resolves.toEqual({ ok: false, error: "Nhân viên không tồn tại." });
  });
});
