"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { requireOwnerScope } from "@/lib/tenant-scope";
import { requireStaffScope } from "@/lib/staff-scope";
import { ensureNotDemoMutation } from "@/lib/read-only-guard";

const statusSchema = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);

export type UpdateBookingStatusResult =
  | { ok: true }
  | { ok: false; error: string };

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

/**
 * Allowed transitions. CANCELLED and COMPLETED are terminal (a cancelled slot
 * is immediately free again for public re-booking). The partial unique index
 * on (staffId, date, startTime) WHERE status IN ('PENDING','CONFIRMED') stays
 * consistent: confirming a PENDING keeps the slot occupied, cancelling frees it.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Change a booking's status. Role + tenancy scoping first, then STAFF is
 * further restricted to bookings whose staffId matches the session user's own
 * staff row (requireStaffScope — email link). A crafted call targeting another
 * staff's booking is rejected before any write happens.
 */
export async function updateBookingStatus(
  bookingId: string,
  rawStatus: string,
): Promise<UpdateBookingStatusResult> {
  ensureNotDemoMutation();
  const parsed = statusSchema.safeParse(rawStatus);
  if (!parsed.success) return { ok: false, error: "Trạng thái không hợp lệ." };

  const user = await requireRole("OWNER", "STAFF");

  let tenantId: string;
  let slug: string;
  let ownStaffId: string | null = null;
  if (user.role === "OWNER") {
    const scope = await requireOwnerScope();
    if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };
    tenantId = scope.tenantId;
    slug = scope.slug;
  } else {
    const scope = await requireStaffScope();
    if (!scope) return { ok: false, error: "Tài khoản nhân viên chưa được liên kết." };
    tenantId = scope.tenantId;
    ownStaffId = scope.staffId;
    slug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug ?? "";
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId },
    select: { id: true, staffId: true, status: true },
  });
  if (!booking) return { ok: false, error: "Lịch hẹn không tồn tại." };

  // STAFF may only touch their own bookings — enforced per action, not just in
  // the page query, so crafted requests cannot reach another staff's row.
  if (ownStaffId !== null && booking.staffId !== ownStaffId) {
    return { ok: false, error: "Bạn không có quyền thao tác lịch hẹn này." };
  }

  const target = parsed.data;
  const allowed = VALID_TRANSITIONS[booking.status];
  if (!allowed.includes(target)) {
    return {
      ok: false,
      error: `Không thể chuyển trạng thái “${BOOKING_STATUS_LABEL[booking.status]}” sang “${BOOKING_STATUS_LABEL[target]}”.`,
    };
  }

  // Where-clause includes the current status so a concurrent status change
  // makes this a no-op instead of clobbering the newer state.
  const result = await prisma.booking.updateMany({
    where: { id: bookingId, tenantId, status: booking.status },
    data: { status: target },
  });
  if (result.count === 0) {
    return { ok: false, error: "Trạng thái vừa thay đổi, vui lòng thử lại." };
  }

  // Status affects slot blocking on the public page (CANCELLED frees the slot,
  // CONFIRMED blocks it) and the dashboard PENDING counter.
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath(`/booking/${slug}`);
  return { ok: true };
}
