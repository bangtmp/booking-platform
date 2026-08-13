import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export type TenantScope = { tenantId: string; slug: string };

/**
 * Tenancy scope for every dashboard write action (services, staff, schedule,
 * bookings): the session user must be an OWNER attached to a tenant, and the
 * tenant's slug is re-read so revalidation targets the correct public page.
 * Every subsequent query is filtered by tenantId so one salon can never touch
 * another salon's data. Returns null when the user has no tenant.
 */
export async function requireOwnerScope(): Promise<TenantScope | null> {
  const user = await requireRole("OWNER");
  if (!user.tenantId) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { slug: true },
  });
  return tenant ? { tenantId: user.tenantId, slug: tenant.slug } : null;
}
