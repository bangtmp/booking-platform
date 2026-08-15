import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { repo } from "@/lib/repo";
import { DEMO_TENANT } from "@/demo/seed-data";
import StaffManager, { type StaffRow } from "./staff-manager";

export const metadata: Metadata = { title: "Nhân viên — Booking Platform" };

export default async function StaffPage() {
  const user = await requireRole("OWNER");
  const isDemo = process.env.DEMO_MODE === "true";
  const tenantId = isDemo && user.tenantId === DEMO_TENANT.id ? DEMO_TENANT.id : user.tenantId;

  const staff = typeof tenantId === "string"
    ? await repo.staff.listByTenant(tenantId)
    : [];

  const rows: StaffRow[] = staff.map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.isActive,
    createdAt: new Date().toISOString(),
  }));

  return <StaffManager staff={rows} isDemo={isDemo} />;
}
