"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  addMinutes,
  getDaySlots,
  getStaffAvailability,
  type BookingInput,
  type ScheduleInput,
} from "@/lib/availability";
import { addDays, tenantNow } from "@/lib/datetime";

const AVAILABILITY_WINDOW_DAYS = 14;
const CONFLICT_ERROR = "Khung giờ này vừa được đặt, vui lòng chọn giờ khác.";

export type AvailabilityDay = { date: string; slots: string[] };

export type GetAvailabilityResult =
  | { ok: true; days: AvailabilityDay[] }
  | { ok: false; error: string };

export type GetAvailableSlotsResult =
  | { ok: true; slots: string[] }
  | { ok: false; error: string };

export type BookingSummary = {
  reference: string;
  tenantName: string;
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  status: "PENDING" | "CONFIRMED";
};

export type CreateBookingResult =
  | { ok: true; booking: BookingSummary }
  | { ok: false; error: string; suggestedSlots?: string[] };

const createBookingSchema = z.object({
  tenantSlug: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ tên (tối thiểu 2 ký tự).")
    .max(100, "Họ tên tối đa 100 ký tự."),
  customerPhone: z
    .string()
    .trim()
    .min(8, "Số điện thoại không hợp lệ.")
    .max(15, "Số điện thoại không hợp lệ.")
    .regex(/^[0-9+\s-]+$/, "Số điện thoại không hợp lệ."),
  note: z
    .string()
    .trim()
    .max(500, "Ghi chú tối đa 500 ký tự.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

function toScheduleInput(
  rows: { dayOfWeek: number; startTime: string; endTime: string }[],
): ScheduleInput[] {
  return rows.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }));
}

/** Slot starts strictly earlier than the tenant-local "now" are not bookable. */
function filterPastSlots(slots: string[], date: string, timeZone: string): string[] {
  const now = tenantNow(timeZone);
  if (date !== now.date) return slots;
  return slots.filter((s) => s > now.time);
}

async function loadServiceAndStaff(tenantId: string, serviceId: string, staffId: string) {
  const [service, staff] = await Promise.all([
    prisma.service.findFirst({ where: { tenantId, id: serviceId, isActive: true } }),
    prisma.staff.findFirst({ where: { tenantId, id: staffId, isActive: true } }),
  ]);
  return { service, staff };
}

/**
 * Slots for one staff + service across the next AVAILABILITY_WINDOW_DAYS days,
 * used to render the date chips. Days with no free slot are omitted.
 */
export async function getAvailability(
  tenantSlug: string,
  staffId: string,
  serviceId: string,
): Promise<GetAvailabilityResult> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return { ok: false, error: "Cơ sở không tồn tại." };
  const { service, staff } = await loadServiceAndStaff(tenant.id, serviceId, staffId);
  if (!service) return { ok: false, error: "Dịch vụ không tồn tại." };
  if (!staff) return { ok: false, error: "Nhân viên không tồn tại." };

  const dateRangeStart = tenantNow(tenant.timezone).date;
  const dateRangeEnd = addDays(dateRangeStart, AVAILABILITY_WINDOW_DAYS - 1);

  const [schedules, bookings] = await Promise.all([
    prisma.schedule.findMany({ where: { tenantId: tenant.id, staffId } }),
    prisma.booking.findMany({
      where: { tenantId: tenant.id, staffId, date: { gte: dateRangeStart, lte: dateRangeEnd } },
    }),
  ]);

  const bookingsByDate: Record<string, BookingInput[]> = {};
  for (const b of bookings) {
    (bookingsByDate[b.date] ??= []).push({
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
    });
  }

  const now = tenantNow(tenant.timezone);
  const days = getStaffAvailability({
    staffId,
    serviceId,
    dateRangeStart,
    dateRangeEnd,
    staffSchedules: toScheduleInput(schedules),
    bookingsByDate,
    serviceMinutes: service.durationMin,
  })
    .map((d) =>
      d.date === now.date
        ? { date: d.date, slots: d.slots.filter((s) => s > now.time) }
        : d,
    )
    .filter((d) => d.slots.length > 0);

  return { ok: true, days };
}

/** Fresh slots for one staff + service on a single date (re-read from DB). */
export async function getAvailableSlots(
  tenantSlug: string,
  staffId: string,
  date: string,
  serviceId: string,
): Promise<GetAvailableSlotsResult> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return { ok: false, error: "Cơ sở không tồn tại." };
  const { service, staff } = await loadServiceAndStaff(tenant.id, serviceId, staffId);
  if (!service) return { ok: false, error: "Dịch vụ không tồn tại." };
  if (!staff) return { ok: false, error: "Nhân viên không tồn tại." };

  const [schedules, bookings] = await Promise.all([
    prisma.schedule.findMany({ where: { tenantId: tenant.id, staffId } }),
    prisma.booking.findMany({ where: { tenantId: tenant.id, staffId, date } }),
  ]);

  const slots = filterPastSlots(
    getDaySlots({
      date,
      schedule: toScheduleInput(schedules),
      bookings: bookings.map((b): BookingInput => ({ startTime: b.startTime, endTime: b.endTime, status: b.status })),
      serviceMinutes: service.durationMin,
    }),
    date,
    tenant.timezone,
  );

  return { ok: true, slots };
}

/** Re-read schedules + bookings and recompute the free slots for one staff+date (past-filtered). */
async function computeFreeSlots(
  tenantId: string,
  staffId: string,
  date: string,
  serviceMinutes: number,
  timeZone: string,
): Promise<string[]> {
  const [schedules, bookings] = await Promise.all([
    prisma.schedule.findMany({ where: { tenantId, staffId } }),
    prisma.booking.findMany({ where: { tenantId, staffId, date } }),
  ]);
  return filterPastSlots(
    getDaySlots({
      date,
      schedule: toScheduleInput(schedules),
      bookings: bookings.map((b): BookingInput => ({ startTime: b.startTime, endTime: b.endTime, status: b.status })),
      serviceMinutes,
    }),
    date,
    timeZone,
  );
}

type CreateBookingTxResult =
  | { ok: true; booking: { id: string; customerName: string; date: string; startTime: string; endTime: string; status: string } }
  | { ok: false; suggested: string[] };

/**
 * Create a booking. Availability is RE-VALIDATED inside the transaction:
 * schedules + existing bookings for the staff+date are re-read and the slot is
 * recomputed with the engine; a slot no longer free (double-booking) is rejected.
 *
 * Concurrency backstop: a partial unique index on (staffId, date, startTime) WHERE
 * status IN ('PENDING','CONFIRMED') guarantees at most one live booking per slot.
 * A P2002 (unique violation) from a simultaneous request is mapped to the same
 * conflict result, so exactly one of two racing bookings can win.
 */
export async function createBooking(
  raw: z.input<typeof createBookingSchema>,
): Promise<CreateBookingResult> {
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
    return { ok: false, error: message };
  }
  const input = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { slug: input.tenantSlug } });
  if (!tenant) return { ok: false, error: "Cơ sở không tồn tại." };

  const now = tenantNow(tenant.timezone);
  const maxDate = addDays(now.date, AVAILABILITY_WINDOW_DAYS - 1);
  if (input.date < now.date) return { ok: false, error: "Không thể đặt lịch trong quá khứ." };
  if (input.date > maxDate) {
    return { ok: false, error: "Chỉ có thể đặt lịch trong 14 ngày tới." };
  }

  const { service, staff } = await loadServiceAndStaff(tenant.id, input.serviceId, input.staffId);
  if (!service) return { ok: false, error: "Dịch vụ không tồn tại." };
  if (!staff) return { ok: false, error: "Nhân viên không tồn tại." };

  let result: CreateBookingTxResult;
  try {
    result = await prisma.$transaction(async (tx) => {
      const [schedules, bookings] = await Promise.all([
        tx.schedule.findMany({ where: { tenantId: tenant.id, staffId: input.staffId } }),
        tx.booking.findMany({ where: { tenantId: tenant.id, staffId: input.staffId, date: input.date } }),
      ]);

      const slots = filterPastSlots(
        getDaySlots({
          date: input.date,
          schedule: toScheduleInput(schedules),
          bookings: bookings.map((b): BookingInput => ({ startTime: b.startTime, endTime: b.endTime, status: b.status })),
          serviceMinutes: service.durationMin,
        }),
        input.date,
        tenant.timezone,
      );

      if (!slots.includes(input.startTime)) {
        return { ok: false as const, suggested: slots };
      }

      const endTime = addMinutes(input.startTime, service.durationMin);
      const booking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          staffId: input.staffId,
          serviceId: input.serviceId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          date: input.date,
          startTime: input.startTime,
          endTime,
          status: tenant.confirmMode === "AUTO" ? "CONFIRMED" : "PENDING",
          note: input.note ?? null,
          createdById: null,
        },
      });
      return { ok: true as const, booking };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const suggested = await computeFreeSlots(
        tenant.id,
        input.staffId,
        input.date,
        service.durationMin,
        tenant.timezone,
      );
      return { ok: false, error: CONFLICT_ERROR, suggestedSlots: suggested.slice(0, 12) };
    }
    throw e;
  }

  if (!result.ok) {
    return { ok: false, error: CONFLICT_ERROR, suggestedSlots: result.suggested.slice(0, 12) };
  }

  return {
    ok: true,
    booking: {
      reference: `#${result.booking.id.slice(0, 8).toUpperCase()}`,
      tenantName: tenant.name,
      serviceName: service.name,
      staffName: staff.name,
      date: result.booking.date,
      startTime: result.booking.startTime,
      endTime: result.booking.endTime,
      customerName: result.booking.customerName,
      status: result.booking.status as "PENDING" | "CONFIRMED",
    },
  };
}
