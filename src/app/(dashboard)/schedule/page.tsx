import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { repo } from "@/lib/repo";
import { DEMO_TENANT, DEMO_SCHEDULES } from "@/demo/seed-data";
import ScheduleManager, { type StaffScheduleRow } from "./schedule-manager";

export const metadata: Metadata = { title: "Lịch làm việc — Booking Platform" };

export default async function SchedulePage() {
  const user = await requireRole("OWNER");
  const isDemo = process.env.DEMO_MODE === "true";

  let rows: StaffScheduleRow[] = [];
  if (user.tenantId) {
    if (isDemo && user.tenantId === DEMO_TENANT.id) {
      const staffRows = await repo.staff.listByTenant(DEMO_TENANT.id);
      rows = staffRows
        .map((staff) => ({
          id: staff.id,
          name: staff.name,
          isActive: staff.isActive,
          schedules: [],
        }))
        .map((row) => ({
          ...row,
          schedules: DEMO_SCHEDULES
            .filter((sch) => sch.staffId === row.id && sch.active)
            .map((sch) => ({
              dayOfWeek: sch.dayOfWeek,
              startTime: sch.startTime,
              endTime: sch.endTime,
              breakStart: sch.breakStart,
              breakEnd: sch.breakEnd,
              active: sch.active,
            })),
        }));
    } else {
      const staff = await prisma.staff.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "asc" },
        include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
      });
      rows = staff.map((s) => ({
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
    }
  }

  return <ScheduleManager staff={rows} isDemo={isDemo} />;
}
