import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();
const mockRequireRole = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { staff: { findFirst: (...args: unknown[]) => mockFindFirst(...args) } },
}));

vi.mock("@/lib/auth-guard", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

import { requireStaffScope } from "../staff-scope";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireStaffScope", () => {
  it("rejects non-STAFF sessions at the role gate (OWNER/ADMIN are not scoped)", async () => {
    mockRequireRole.mockRejectedValueOnce(new Error("redirect:/dashboard"));
    await expect(requireStaffScope()).rejects.toThrow("redirect");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("maps a STAFF session to their own staff row via email link", async () => {
    mockRequireRole.mockResolvedValueOnce({
      role: "STAFF",
      tenantId: "tenant-1",
      email: "staff@demo.com",
    });
    mockFindFirst.mockResolvedValueOnce({ id: "staff-9" });
    await expect(requireStaffScope()).resolves.toEqual({
      tenantId: "tenant-1",
      staffId: "staff-9",
    });
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { tenantId: "tenant-1", userEmail: "staff@demo.com" },
      select: { id: true },
    });
  });

  it("returns null for a STAFF session without a tenant or email", async () => {
    mockRequireRole.mockResolvedValueOnce({ role: "STAFF", tenantId: null, email: null });
    await expect(requireStaffScope()).resolves.toBeNull();
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("returns null for an unlinked STAFF (no matching staff row in their tenant)", async () => {
    mockRequireRole.mockResolvedValueOnce({
      role: "STAFF",
      tenantId: "tenant-1",
      email: "unlinked@demo.com",
    });
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(requireStaffScope()).resolves.toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { tenantId: "tenant-1", userEmail: "unlinked@demo.com" },
      select: { id: true },
    });
  });
});
