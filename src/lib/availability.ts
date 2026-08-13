/**
 * Availability slot engine — PURE logic, no DB, no Next.js imports.
 *
 * Conventions / assumptions (see task-4-report.md):
 * - Times are tenant-local wall-clock strings "HH:mm" (zero-padded, 24h),
 *   plus the sentinel "24:00" (end of day). `Asia/Ho_Chi_Minh` per tenant.
 *   NO timezone conversion happens here.
 * - Dates are "YYYY-MM-DD" strings; dayOfWeek uses the UTC calendar so the
 *   result is identical in any server timezone (0=Sunday .. 6=Saturday).
 * - Schedules do NOT cross midnight (startTime <= endTime, endTime may be
 *   "24:00").
 * - Slots are half-open intervals [start, end). A slot ending exactly when
 *   a booking/break starts, or starting exactly when one ends, is free.
 * - Slot starts snap to the step grid (default 30 min) from midnight, so a
 *   dayStart off-grid (e.g. 09:15) yields 09:30, 10:00, ...
 * - Only bookings with status PENDING/CONFIRMED occupy a slot. CANCELLED /
 *   COMPLETED (or any status not in `blockingStatuses`) do not. A booking
 *   with NO status is treated as occupying (conservative default).
 */

export interface ScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  active?: boolean;
}

export interface BookingInput {
  startTime: string;
  endTime: string;
  status?: string;
}

export interface GetDaySlotsOptions {
  date: string;
  schedule: ScheduleInput | ScheduleInput[] | null | undefined;
  bookings?: BookingInput[];
  serviceMinutes: number;
  stepMinutes?: number;
  blockingStatuses?: readonly string[];
}

export interface FindAvailabilityOptions {
  dateRangeStart: string;
  dateRangeEnd: string;
  staffSchedules: ScheduleInput[];
  bookingsByDate?: Record<string, BookingInput[]>;
  serviceMinutes: number;
  stepMinutes?: number;
  limit?: number;
}

export interface StaffAvailabilityOptions {
  staffId: string;
  serviceId?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  staffSchedules: ScheduleInput[];
  bookingsByDate?: Record<string, BookingInput[]>;
  serviceMinutes: number;
  stepMinutes?: number;
}

export interface StaffDayAvailability {
  staffId: string;
  serviceId?: string;
  date: string;
  slots: string[];
}

export const DEFAULT_STEP_MINUTES = 30;
export const DEFAULT_BLOCKING_STATUSES = ['PENDING', 'CONFIRMED'] as const;
export const MINUTES_PER_DAY = 24 * 60;

export function parseTime(time: string): number {
  if (time === '24:00') return MINUTES_PER_DAY;
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`Invalid time string "${time}" (expected "HH:mm")`);
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time string "${time}" (expected "HH:mm")`);
  }
  return hours * 60 + minutes;
}

export function formatMinutes(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > MINUTES_PER_DAY) {
    throw new Error(`Cannot format minutes ${minutes} (expected 0..1440 integer)`);
  }
  if (minutes === MINUTES_PER_DAY) return '24:00';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function addMinutes(time: string, minutes: number): string {
  return formatMinutes(parseTime(time) + minutes);
}

export function dayOfWeekFromDate(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date string "${date}" (expected "YYYY-MM-DD")`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date string "${date}" (expected "YYYY-MM-DD")`);
  }
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function overlapsMinutes(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

export function isOverlapping(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return overlapsMinutes(parseTime(aStart), parseTime(aEnd), parseTime(bStart), parseTime(bEnd));
}

export function generateSlots(
  dayStart: string,
  dayEnd: string,
  durationMinutes: number,
  stepMinutes: number = DEFAULT_STEP_MINUTES,
): string[] {
  const start = parseTime(dayStart);
  const end = parseTime(dayEnd);
  if (stepMinutes <= 0) throw new Error(`stepMinutes must be positive (got ${stepMinutes})`);
  const slots: string[] = [];
  let cursor = Math.ceil(start / stepMinutes) * stepMinutes;
  while (cursor + durationMinutes <= end) {
    slots.push(formatMinutes(cursor));
    cursor += stepMinutes;
  }
  return slots;
}

export interface BookedInterval {
  start: string;
  end: string;
}

export function availableSlots(
  dayStart: string,
  dayEnd: string,
  durationMinutes: number,
  booked: BookedInterval[],
  stepMinutes: number = DEFAULT_STEP_MINUTES,
): string[] {
  const bookedMinutes = booked
    .map((b) => ({ start: parseTime(b.start), end: parseTime(b.end) }))
    .filter((b) => b.end > b.start);
  return generateSlots(dayStart, dayEnd, durationMinutes, stepMinutes).filter((slot) => {
    const s = parseTime(slot);
    const e = s + durationMinutes;
    return !bookedMinutes.some((b) => overlapsMinutes(s, e, b.start, b.end));
  });
}

function isBlocking(status: string | undefined, blockingStatuses: ReadonlySet<string>): boolean {
  if (status === undefined) return true;
  return blockingStatuses.has(status);
}

export function getDaySlots(options: GetDaySlotsOptions): string[] {
  const { date, bookings = [], serviceMinutes } = options;
  const stepMinutes = options.stepMinutes ?? DEFAULT_STEP_MINUTES;
  const blockingStatuses = new Set(options.blockingStatuses ?? DEFAULT_BLOCKING_STATUSES);
  const day = dayOfWeekFromDate(date);
  const schedules = (
    Array.isArray(options.schedule) ? options.schedule : options.schedule ? [options.schedule] : []
  ).filter((s) => s.dayOfWeek === day && s.active !== false);
  if (schedules.length === 0) return [];

  const blocked: BookedInterval[] = bookings
    .filter((b) => isBlocking(b.status, blockingStatuses))
    .map((b) => ({ start: b.startTime, end: b.endTime }));

  const slots = new Set<string>();
  for (const schedule of schedules) {
    const intervals = [...blocked];
    if (
      schedule.breakStart !== undefined &&
      schedule.breakEnd !== undefined &&
      parseTime(schedule.breakStart) < parseTime(schedule.breakEnd)
    ) {
      intervals.push({ start: schedule.breakStart, end: schedule.breakEnd });
    }
    for (const slot of availableSlots(schedule.startTime, schedule.endTime, serviceMinutes, intervals, stepMinutes)) {
      slots.add(slot);
    }
  }
  return [...slots].sort();
}

function toUtcDate(date: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date string "${date}" (expected "YYYY-MM-DD")`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function toDateString(utcDate: Date): string {
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function findAvailability(options: FindAvailabilityOptions): string[] {
  const {
    dateRangeStart,
    dateRangeEnd,
    staffSchedules,
    bookingsByDate = {},
    serviceMinutes,
    stepMinutes = DEFAULT_STEP_MINUTES,
    limit = 7,
  } = options;
  const start = toUtcDate(dateRangeStart);
  const end = toUtcDate(dateRangeEnd);
  const results: string[] = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime() && results.length < limit) {
    const dateStr = toDateString(cursor);
    const slots = getDaySlots({
      date: dateStr,
      schedule: staffSchedules,
      bookings: bookingsByDate[dateStr],
      serviceMinutes,
      stepMinutes,
    });
    if (slots.length > 0) results.push(dateStr);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return results;
}

export function getStaffAvailability(options: StaffAvailabilityOptions): StaffDayAvailability[] {
  const {
    staffId,
    serviceId,
    dateRangeStart,
    dateRangeEnd,
    staffSchedules,
    bookingsByDate = {},
    serviceMinutes,
    stepMinutes = DEFAULT_STEP_MINUTES,
  } = options;
  const start = toUtcDate(dateRangeStart);
  const end = toUtcDate(dateRangeEnd);
  const results: StaffDayAvailability[] = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    const dateStr = toDateString(cursor);
    const slots = getDaySlots({
      date: dateStr,
      schedule: staffSchedules,
      bookings: bookingsByDate[dateStr],
      serviceMinutes,
      stepMinutes,
    });
    if (slots.length > 0) {
      results.push({ staffId, ...(serviceId !== undefined ? { serviceId } : {}), date: dateStr, slots });
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return results;
}
