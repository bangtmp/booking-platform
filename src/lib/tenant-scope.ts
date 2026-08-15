import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DEMO_TENANT } from "@/demo/seed-data";

export type TenantScope = { tenantId: string; slug: string };

const isDemo = process.env.DEMO_MODE === "true";

export async function requireOwnerScope(): Promise<TenantScope | null> {
  const user = await requireRole("OWNER");
  if (!user.tenantId) return null;
  if (isDemo) return { tenantId: DEMO_TENANT.id, slug: DEMO_TENANT.slug };
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { slug: true },
  });
  return tenant ? { tenantId: user.tenantId, slug: tenant.slug } : null;
}
