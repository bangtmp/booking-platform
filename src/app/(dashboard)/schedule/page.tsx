import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import ScheduleManager, { type StaffScheduleRow } from "./schedule-manager";

export const metadata: Metadata = { title: "Lịch làm việc — Booking Platform" };

export default async function SchedulePage() {
  const user = await requireRole("OWNER");

  const staff = user.tenantId
    ? await prisma.staff.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "asc" },
        include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
      })
    : [];

  const rows: StaffScheduleRow[] = staff.map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.isActive,
    schedules: s.schedules.map((sch) => ({
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      breakStart: sch.breakStart,
      breakEnd: sch.breakEnd,
      active: sch.active,
    })),
  }));

  return <ScheduleManager staff={rows} />;
}
