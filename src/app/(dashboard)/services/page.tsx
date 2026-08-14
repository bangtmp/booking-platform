import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { repo } from "@/lib/repo";
import { DEMO_TENANT } from "@/demo/seed-data";
import ServicesManager, { type ServiceRow } from "./services-manager";

export const metadata: Metadata = { title: "Dịch vụ — Booking Platform" };

export default async function ServicesPage() {
  const user = await requireRole("OWNER");
  const isDemo = process.env.DEMO_MODE === "true";
  const tenantId = isDemo && user.tenantId === DEMO_TENANT.id ? DEMO_TENANT.id : user.tenantId;

  const services = tenantId
    ? await repo.service.listByTenant(tenantId)
    : [];

  const rows: ServiceRow[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMin: s.durationMin,
    price: s.price.toString(),
    isActive: s.isActive,
    createdAt: new Date().toISOString(),
  }));

  return <ServicesManager services={rows} isDemo={isDemo} />;
}
