import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import ServicesManager, { type ServiceRow } from "./services-manager";

export const metadata: Metadata = { title: "Dịch vụ — Booking Platform" };

export default async function ServicesPage() {
  const user = await requireRole("OWNER");

  const services = user.tenantId
    ? await prisma.service.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const rows: ServiceRow[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMin: s.durationMin,
    price: s.price.toString(),
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  }));

  return <ServicesManager services={rows} />;
}
