import { requireRole } from "@/lib/auth-guard";
import { repo } from "@/lib/repo";
import { DEMO_TENANT, DEMO_STAFFS } from "@/demo/seed-data";

export type StaffScope = { tenantId: string; staffId: string };

const isDemo = process.env.DEMO_MODE === "true";

export async function requireStaffScope(): Promise<StaffScope | null> {
  const user = await requireRole("STAFF");
  if (!user.tenantId || !user.email) return null;
  if (isDemo) {
    const staff = DEMO_STAFFS.find((s) => s.userEmail === user.email) ?? DEMO_STAFFS[0] ?? null;
    return staff ? { tenantId: DEMO_TENANT.id, staffId: staff.id } : null;
  }
  const staffRows = await repo.staff.listByTenant(user.tenantId);
  const staff = staffRows.find((s) => s.userEmail === user.email) ?? null;
  return staff ? { tenantId: user.tenantId, staffId: staff.id } : null;
}
