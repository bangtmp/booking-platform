import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole, homeForRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DEMO_TENANT } from "@/demo/seed-data";
import { addDays, tenantNow } from "@/lib/datetime";
import { requireOwnerScope } from "@/lib/tenant-scope";
import { requireStaffScope } from "@/lib/staff-scope";
import WeekCalendar, { type CalendarDay } from "./week-calendar";

export const metadata: Metadata = { title: "Lịch hẹn — Booking Platform" };

const DAY_SHORT_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_FULL_VN = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

function mondayOf(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date "${date}" (expected YYYY-MM-DD)`);
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

function parseWeekStart(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return mondayOf(raw);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const user = await requireRole("OWNER", "STAFF");
  const role = user.role as "OWNER" | "STAFF";
  const isDemo = process.env.DEMO_MODE === "true";

  // Role-aware tenancy scope. STAFF additionally resolves to their own staff
  // row (email link), which is the carry-over Task 6 acceptance criterion:
  // STAFF sees only their own bookings — enforced in this query AND per-action.
  let tenantId: string;
  let slug: string;
  let ownStaffId: string | null = null;
  if (role === "OWNER") {
    const scope = await requireOwnerScope();
    if (!scope) {
      redirect(homeForRole("OWNER"));
    }
    tenantId = scope.tenantId;
    slug = scope.slug;
  } else {
    const scope = await requireStaffScope();
    if (!scope) {
      return (
        <div className="rounded-xl border border-blush-border bg-white p-8 text-center shadow-sm">
          <p className="font-display text-lg font-bold text-zinc-900">Chưa liên kết nhân viên</p>
          <p className="mt-2 text-sm text-zinc-500">
            Tài khoản nhân viên của bạn chưa được liên kết với hồ sơ nhân viên trong cơ sở. Hãy nhờ chủ cơ sở liên kết email tài khoản với nhân viên để xem lịch hẹn.
          </p>
        </div>
      );
    }
    tenantId = scope.tenantId;
    ownStaffId = scope.staffId;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
    slug = tenant?.slug ?? "";
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, confirmMode: true, timezone: true },
  });
  if (!tenant || tenant.slug !== slug) redirect(homeForRole(role));

  const params = await searchParams;
  const today = tenantNow(tenant.timezone).date;
  const weekStart = parseWeekStart(params.start) ?? mondayOf(today);
  const weekEnd = addDays(weekStart, 6);

  const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dow = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))).getUTCDay();
    return {
      date,
      dayName: DAY_FULL_VN[dow],
      short: `${DAY_SHORT_VN[dow]} ${date.slice(8)}/${date.slice(5, 7)}`,
      isToday: date === today,
    };
  });

  const staffWhere = { tenantId, ...(ownStaffId ? { id: ownStaffId } : {}) };
  const [staffs, schedules, bookings] = await Promise.all([
    prisma.staff.findMany({
      where: staffWhere,
      select: { id: true, name: true, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.schedule.findMany({
      where: { tenantId },
      select: { staffId: true, dayOfWeek: true, active: true },
    }),
    prisma.booking.findMany({
      where: {
        tenantId,
        date: { gte: weekStart, lte: weekEnd },
        ...(ownStaffId ? { staffId: ownStaffId } : {}),
      },
      select: {
        id: true,
        staffId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        customerName: true,
        service: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  // Closed days for each staff: no row OR row.active === false (the schedule
  // editor's invariant is "no row = closed").
  const scheduleByStaff: Record<string, Map<number, boolean>> = {};
  for (const s of schedules) {
    (scheduleByStaff[s.staffId] ??= new Map()).set(s.dayOfWeek, s.active);
  }
  const closedDays: Record<string, number[]> = {};
  for (const staff of staffs) {
    const map = scheduleByStaff[staff.id];
    const closed: number[] = [];
    for (let dow = 0; dow <= 6; dow++) {
      if (!map || !map.get(dow)) closed.push(dow);
    }
    closedDays[staff.id] = closed;
  }

  return (
    <WeekCalendar
      days={days}
      staffs={staffs}
      bookings={bookings}
      closedDays={closedDays}
      weekStart={weekStart}
      confirmMode={tenant.confirmMode}
      isOwner={role === "OWNER"}
    />
  );
}
