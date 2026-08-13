"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnerScope } from "@/lib/tenant-scope";
import { parseTime } from "@/lib/availability";

/**
 * One row of the weekly grid. Mirrors the engine's `ScheduleInput` shape
 * (plus the non-optional key fields) so a saved row can be fed to
 * `getDaySlots`/`generateSlots` unchanged:
 *   { dayOfWeek, startTime, endTime, breakStart?, breakEnd?, active? }
 * Times are "HH:mm" (endTime may be the "24:00" end-of-day sentinel).
 * `active: false` → the day is skipped by the engine; `breakStart/End` null
 * → no break (engine ignores malformed/null breaks as a safety net).
 */
export type ScheduleRowInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  active?: boolean;
};

export type SaveScheduleResult =
  | { ok: true }
  | { ok: false; error: string };

/** Start-of-day times are real wall-clock: never the "24:00" sentinel. */
const startTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ bắt đầu phải đúng định dạng HH:mm.");

/** End-of-day may be "24:00" (engine convention for "to end of day"). */
const endTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/, "Giờ kết thúc phải đúng định dạng HH:mm.");

const breakTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ nghỉ phải đúng định dạng HH:mm.")
  .nullable()
  .optional();

const scheduleRowSchema = z
  .object({
    dayOfWeek: z
      .number()
      .int("Ngày trong tuần không hợp lệ.")
      .min(0, "Ngày trong tuần không hợp lệ.")
      .max(6, "Ngày trong tuần không hợp lệ."),
    startTime: startTimeSchema,
    endTime: endTimeSchema,
    breakStart: breakTimeSchema,
    breakEnd: breakTimeSchema,
    active: z.boolean().optional(),
  })
  .superRefine((row, ctx) => {
    // Times already pass the regex (object fields parsed OK before refinement
    // runs), so parseTime is safe — and it is the SAME parser the availability
    // engine uses, keeping UI validation and engine consumption in lockstep.
    if (parseTime(row.endTime) <= parseTime(row.startTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Giờ kết thúc phải sau giờ bắt đầu.",
      });
    }

    const breakStartStr = row.breakStart != null && row.breakStart.length > 0 ? row.breakStart : null;
    const breakEndStr = row.breakEnd != null && row.breakEnd.length > 0 ? row.breakEnd : null;
    if ((breakStartStr === null) !== (breakEndStr === null)) {
      ctx.addIssue({
        code: "custom",
        path: ["breakStart"],
        message: "Cần nhập đầy đủ cả giờ bắt đầu và giờ kết thúc nghỉ.",
      });
    } else if (breakStartStr !== null && breakEndStr !== null) {
      const breakStart = parseTime(breakStartStr);
      const breakEnd = parseTime(breakEndStr);
      if (breakEnd <= breakStart) {
        ctx.addIssue({
          code: "custom",
          path: ["breakEnd"],
          message: "Giờ kết thúc nghỉ phải sau giờ bắt đầu nghỉ.",
        });
      } else if (breakStart < parseTime(row.startTime) || breakEnd > parseTime(row.endTime)) {
        ctx.addIssue({
          code: "custom",
          path: ["breakStart"],
          message: "Thời gian nghỉ phải nằm trong khung giờ làm việc.",
        });
      }
    }
  });

const scheduleRowsSchema = z.array(scheduleRowSchema).min(1, "Vui lòng khai báo ít nhất một ngày làm việc.");

/** Keep the schedule editor + home stats + the public booking page in sync. */
function revalidateSchedulePaths(slug: string) {
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/booking/${slug}`);
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

/**
 * Replace/upsert the weekly schedule for one staff. Exactly one schedule per
 * staff per day is enforced at the DB level (`@@unique([staffId, dayOfWeek])`),
 * so the editor's fixed 7-row grid maps 1:1 onto rows. Days not present in the
 * submitted array are left untouched (the editor always submits all 7 rows).
 *
 * Upserts are tenant-scoped: staffId is first verified to belong to the
 * session tenant, and created rows carry `tenantId` from the session scope.
 */
export async function saveSchedule(
  staffId: string,
  raw: ScheduleRowInput[],
): Promise<SaveScheduleResult> {
  const parsed = scheduleRowsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: scope.tenantId },
    select: { id: true },
  });
  if (!staff) return { ok: false, error: "Nhân viên không tồn tại." };

  const rows = parsed.data;
  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.dayOfWeek)) {
      return { ok: false, error: "Mỗi ngày trong tuần chỉ được khai báo một khung giờ." };
    }
    seen.add(row.dayOfWeek);
  }

  await prisma.$transaction(
    rows.map((row) =>
      prisma.schedule.upsert({
        where: { staffId_dayOfWeek: { staffId, dayOfWeek: row.dayOfWeek } },
        create: {
          tenantId: scope.tenantId,
          staffId,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          breakStart: row.breakStart ?? null,
          breakEnd: row.breakEnd ?? null,
          active: row.active ?? true,
        },
        update: {
          startTime: row.startTime,
          endTime: row.endTime,
          // Conditional spread — an omitted field leaves the stored value
          // untouched (same rule as the services fix).
          ...(row.breakStart !== undefined ? { breakStart: row.breakStart } : {}),
          ...(row.breakEnd !== undefined ? { breakEnd: row.breakEnd } : {}),
          ...(row.active !== undefined ? { active: row.active } : {}),
        },
      }),
    ),
  );

  revalidateSchedulePaths(scope.slug);
  return { ok: true };
}
