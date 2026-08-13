"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnerScope } from "@/lib/tenant-scope";

export type StaffInput = {
  name: string;
  isActive?: boolean;
};

export type StaffActionResult =
  | { ok: true }
  | { ok: false; error: string };

const staffInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên nhân viên.")
    .max(100, "Tên nhân viên tối đa 100 ký tự."),
  isActive: z.boolean().optional(),
});

/** Keep the dashboard list + home stats + the public booking page in sync. */
function revalidateStaffPaths(slug: string) {
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  revalidatePath(`/booking/${slug}`);
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

export async function createStaff(raw: StaffInput): Promise<StaffActionResult> {
  const parsed = staffInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const input = parsed.data;
  await prisma.staff.create({
    data: {
      tenantId: scope.tenantId,
      name: input.name,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  revalidateStaffPaths(scope.slug);
  return { ok: true };
}

export async function updateStaff(
  id: string,
  raw: StaffInput,
): Promise<StaffActionResult> {
  const parsed = staffInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const input = parsed.data;
  const res = await prisma.staff.updateMany({
    where: { id, tenantId: scope.tenantId },
    data: {
      name: input.name,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  if (res.count === 0) return { ok: false, error: "Nhân viên không tồn tại." };

  revalidateStaffPaths(scope.slug);
  return { ok: true };
}

/**
 * Toggle isActive. Inactive staff are filtered out of the public booking page
 * immediately (page.tsx `isActive: true`) — revalidation makes that visible on
 * the next request. The target state is passed explicitly (idempotent).
 */
export async function toggleStaffActive(
  id: string,
  isActive: boolean,
): Promise<StaffActionResult> {
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const res = await prisma.staff.updateMany({
    where: { id, tenantId: scope.tenantId },
    data: { isActive },
  });
  if (res.count === 0) return { ok: false, error: "Nhân viên không tồn tại." };

  revalidateStaffPaths(scope.slug);
  return { ok: true };
}

/**
 * Delete with the FK constraint: Booking.staffId is onDelete: Restrict, so a
 * staff that already has bookings can't be removed — Prisma raises P2003 and
 * we surface a friendly message (mirrors deleteService). Staff schedules are
 * cascaded away (Schedule.staffId onDelete: Cascade).
 *
 * deleteMany is atomic AND tenant-scoped, so there is no check-then-delete
 * race: a concurrent delete/toggle from another tab simply makes count 0
 * (friendly "not found") instead of throwing P2025, and a row from another
 * tenant can never be touched. P2003 (Restrict) is still raised and mapped.
 */
export async function deleteStaff(id: string): Promise<StaffActionResult> {
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  try {
    const res = await prisma.staff.deleteMany({
      where: { id, tenantId: scope.tenantId },
    });
    if (res.count === 0) return { ok: false, error: "Nhân viên không tồn tại." };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Nhân viên này đã có lịch hẹn, không thể xóa." };
    }
    throw e;
  }

  revalidateStaffPaths(scope.slug);
  return { ok: true };
}
