"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnerScope } from "@/lib/tenant-scope";
import { isValidTimeZone } from "@/lib/timezones";

export type TenantSettingsInput = {
  name: string;
  businessType: "SALON" | "SPA" | "CLINIC" | "OTHER";
  timezone: string;
  confirmMode: "AUTO" | "MANUAL";
};

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

const tenantSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên cơ sở.")
    .max(100, "Tên cơ sở tối đa 100 ký tự."),
  businessType: z.enum(["SALON", "SPA", "CLINIC", "OTHER"]),
  timezone: z
    .string()
    .min(1, "Vui lòng chọn múi giờ.")
    .refine(isValidTimeZone, { message: "Múi giờ không hợp lệ." }),
  confirmMode: z.enum(["AUTO", "MANUAL"]),
});

const linkStaffSchema = z.object({
  staffId: z.string().min(1, "Mã nhân viên không hợp lệ."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ.")
    .max(254, "Email không hợp lệ."),
});

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

/**
 * The settings action can change anything that affects other routes: the name
 * (shell + dashboard), the timezone (availability window "today" on every
 * route), confirmMode (new-booking status on /booking/{slug} + the Duyệt gate
 * on /bookings), and staff links (a linked STAFF account immediately sees their
 * row on /bookings). Revalidate all of them so the change is visible on the
 * next request. Slug is immutable (see page.tsx), so `scope.slug` is always the
 * correct public path.
 */
function revalidateSettingsPaths(slug: string) {
  revalidatePath("/settings");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath(`/booking/${slug}`);
}

/**
 * Update tenant basics. confirmMode takes effect immediately because both the
 * public createBooking action and the /bookings page read the CURRENT tenant
 * row from the DB on every call — an existing PENDING booking keeps its status
 * (only NEW bookings respect the new mode).
 */
export async function updateTenantSettings(
  raw: TenantSettingsInput,
): Promise<SettingsActionResult> {
  const parsed = tenantSettingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const input = parsed.data;
  await prisma.tenant.update({
    where: { id: scope.tenantId },
    data: {
      name: input.name,
      businessType: input.businessType,
      timezone: input.timezone,
      confirmMode: input.confirmMode,
    },
  });

  revalidateSettingsPaths(scope.slug);
  return { ok: true };
}

/**
 * Link a Staff row to a User account by email (Task 9 carry-over: the staff
 * dashboard maps Staff.userEmail to the session User.email within the tenant).
 * Requirements per task brief: the email must exist as a User account, and it
 * must not already be linked to another staff in this tenant. The second rule
 * is enforced by the @@unique([tenantId, userEmail]) constraint — a crafted
 * double-link raises P2002, which we map to a friendly error.
 */
export async function linkStaffEmail(
  raw: { staffId: string; email: string },
): Promise<SettingsActionResult> {
  const parsed = linkStaffSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const { staffId, email } = parsed.data;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: scope.tenantId },
    select: { id: true },
  });
  if (!staff) return { ok: false, error: "Nhân viên không tồn tại." };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return {
      ok: false,
      error: "Không tìm thấy tài khoản với email này. Nhân viên phải đăng ký tài khoản trước khi liên kết.",
    };
  }

  try {
    const res = await prisma.staff.updateMany({
      where: { id: staffId, tenantId: scope.tenantId },
      data: { userEmail: email },
    });
    if (res.count === 0) return { ok: false, error: "Nhân viên không tồn tại." };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "Email này đã được liên kết với nhân viên khác trong cơ sở.",
      };
    }
    throw e;
  }

  revalidateSettingsPaths(scope.slug);
  return { ok: true };
}

/**
 * Remove the email link. Nulls are always distinct in a Postgres unique index,
 * so unlinking can never collide. The unlinked staff hits the "Chưa liên kết
 * nhân viên" notice card on /bookings again until re-linked.
 */
export async function unlinkStaffEmail(staffId: string): Promise<SettingsActionResult> {
  const scope = await requireOwnerScope();
  if (!scope) return { ok: false, error: "Tài khoản chưa gắn với cơ sở." };

  const res = await prisma.staff.updateMany({
    where: { id: staffId, tenantId: scope.tenantId },
    data: { userEmail: null },
  });
  if (res.count === 0) return { ok: false, error: "Nhân viên không tồn tại." };

  revalidateSettingsPaths(scope.slug);
  return { ok: true };
}
