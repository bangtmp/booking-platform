import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export type StaffScope = { tenantId: string; staffId: string };

/**
 * Tenancy + staff scope for STAFF dashboard reads/writes (bookings). A STAFF
 * user maps to their Staff row by `Staff.userEmail === User.email` within the
 * session user's tenant (schema decision documented on the Staff model). This
 * is what enforces "STAFF sees only their own bookings" — both the page query
 * and every status-transition action go through the returned staffId.
 * Returns null when the user has no tenant or no matching staff row.
 */
export async function requireStaffScope(): Promise<StaffScope | null> {
  const user = await requireRole("STAFF");
  if (!user.tenantId || !user.email) return null;
  const staff = await prisma.staff.findFirst({
    where: { tenantId: user.tenantId, userEmail: user.email },
    select: { id: true },
  });
  return staff ? { tenantId: user.tenantId, staffId: staff.id } : null;
}
