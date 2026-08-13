"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

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
    .max(999_999_999_999, "Giá vượt quá giới hạn."),
  isActive: z.boolean().optional(),
});

/**
 * Tenancy scope for every write: the session user must be an OWNER attached to
 * a tenant. Every subsequent query is filtered by this tenantId so one salon
 * can never touch another salon's data.
 */
async function requireOwnerScope(): Promise<{ tenantId: string; slug: string } | null> {
  const user = await requireRole("OWNER");
  if (!user.tenantId) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { slug: true },
  });
  return tenant ? { tenantId: user.tenantId, slug: tenant.slug } : null;
}

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
      isActive: input.isActive ?? true,
    },
  });

  revalidateServicePaths(scope.slug);
  return { ok: true };
}

export async function updateService(
  id: string,
  raw: ServiceInput,
): Promise<ServiceActionResult> {
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
      isActive: input.isActive ?? true,
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
 */
export async function deleteService(id: string): Promise<ServiceActionResult> {
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const existing = await prisma.service.findFirst({
    where: { id, tenantId: scope.tenantId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Dịch vụ không tồn tại." };

  try {
    await prisma.service.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Dịch vụ này đã có lịch hẹn, không thể xóa." };
    }
    throw e;
  }

  revalidateServicePaths(scope.slug);
  return { ok: true };
}
