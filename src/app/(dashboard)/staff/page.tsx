import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import StaffManager, { type StaffRow } from "./staff-manager";

export const metadata: Metadata = { title: "Nhân viên — Booking Platform" };

export default async function StaffPage() {
  const user = await requireRole("OWNER");

  const staff = user.tenantId
    ? await prisma.staff.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const rows: StaffRow[] = staff.map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  }));

  return <StaffManager staff={rows} />;
}
