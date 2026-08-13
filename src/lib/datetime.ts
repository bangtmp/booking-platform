/**
 * Pure date/time helpers shared between server actions and client components.
 * Dates are "YYYY-MM-DD" strings (UTC calendar, matching availability.ts),
 * times are "HH:mm" strings. No timezone conversion — only tenant-local wall
 * clock via Intl when a timezone is provided.
 */

export function addDays(date: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date "${date}" (expected "YYYY-MM-DD")`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Tenant-local "now" as a date string + "HH:mm" time string. */
export function tenantNow(timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export const DAY_NAMES_VN = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

const DAY_SHORT_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function dayOfWeek(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date "${date}" (expected "YYYY-MM-DD")`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
}

/** "2026-08-13" -> "Thứ năm, 13/08/2026" */
export function formatDateVn(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${DAY_NAMES_VN[dayOfWeek(date)]}, ${m[3]}/${m[2]}/${m[1]}`;
}

/** "2026-08-13" -> "T5 13/08" (compact chip label) */
export function formatDateChipVn(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${DAY_SHORT_VN[dayOfWeek(date)]} ${m[3]}/${m[2]}`;
}

export function formatPriceVn(price: string | number): string {
  return `${Number(price).toLocaleString("vi-VN")} đ`;
}

export function formatTimeRangeVn(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}
