"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnerScope } from "@/lib/tenant-scope";
import { ensureNotDemoMutation } from "@/lib/read-only-guard";

export type ServiceInput = {
  name: string;
  durationMin: number;
  price: number;
  isActive?: boolean;
};

export type ServiceActionResult =
  | { ok: true }
  | { ok: false; error: string };

const serviceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên dịch vụ.")
    .max(100, "Tên dịch vụ tối đa 100 ký tự."),
  durationMin: z
    .coerce
    .number()
    .int("Thời lượng phải là số nguyên (phút).")
    .min(1, "Thời lượng tối thiểu 1 phút.")
    .max(1440, "Thời lượng tối đa 1440 phút (1 ngày)."),
  price: z
    .coerce
    .number()
    .int("Giá phải là số nguyên (VNĐ).")
    .nonnegative("Giá không được nhỏ hơn 0.")
    .multipleOf(1000, "Giá phải là bội số của 1.000 VNĐ.")
    .max(999_999_999_999, "Giá vượt quá giới hạn."),
  isActive: z.boolean().optional(),
});

/** Keep the dashboard list + home stats + the public booking page in sync. */
function revalidateServicePaths(slug: string) {
  revalidatePath("/services");
  revalidatePath("/dashboard");
  revalidatePath(`/booking/${slug}`);
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

export async function createService(raw: ServiceInput): Promise<ServiceActionResult> {
  ensureNotDemoMutation();
  const parsed = serviceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const input = parsed.data;
  await prisma.service.create({
    data: {
      tenantId: scope.tenantId,
      name: input.name,
      durationMin: input.durationMin,
      price: input.price,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  revalidateServicePaths(scope.slug);
  return { ok: true };
}

export async function updateService(
  id: string,
  raw: ServiceInput,
): Promise<ServiceActionResult> {
  ensureNotDemoMutation();
  const parsed = serviceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const input = parsed.data;
  const res = await prisma.service.updateMany({
    where: { id, tenantId: scope.tenantId },
    data: {
      name: input.name,
      durationMin: input.durationMin,
      price: input.price,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  if (res.count === 0) return { ok: false, error: "Dịch vụ không tồn tại." };

  revalidateServicePaths(scope.slug);
  return { ok: true };
}

/**
 * Toggle isActive. Inactive services are filtered out of the public booking
 * page immediately (see page.tsx `isActive: true`) — revalidation makes that
 * visible to customers on the next request.
 */
export async function toggleServiceActive(
  id: string,
  isActive: boolean,
): Promise<ServiceActionResult> {
  ensureNotDemoMutation();
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const res = await prisma.service.updateMany({
    where: { id, tenantId: scope.tenantId },
    data: { isActive },
  });
  if (res.count === 0) return { ok: false, error: "Dịch vụ không tồn tại." };

  revalidateServicePaths(scope.slug);
  return { ok: true };
}

/**
 * Delete with the FK constraint: Booking.serviceId is onDelete: Restrict, so a
 * service that already has bookings can't be removed — Prisma raises P2003 and
 * we surface a friendly message. Deleting a booking-less service removes it
 * from both the dashboard and the public page.
 *
 * deleteMany is atomic AND tenant-scoped, so there is no check-then-delete race:
 * a concurrent delete/toggle from another tab simply makes count 0 (friendly
 * "not found") instead of throwing P2025, and a row from another tenant can
 * never be touched. P2003 (Restrict) is still raised on deleteMany and mapped.
 */
export async function deleteService(id: string): Promise<ServiceActionResult> {
  ensureNotDemoMutation();
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  try {
    const res = await prisma.service.deleteMany({
      where: { id, tenantId: scope.tenantId },
    });
    if (res.count === 0) return { ok: false, error: "Dịch vụ không tồn tại." };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Dịch vụ này đã có lịch hẹn, không thể xóa." };
    }
    throw e;
  }

  revalidateServicePaths(scope.slug);
  return { ok: true };
}
