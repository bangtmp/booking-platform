import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import SettingsManager, { type SettingsStaff, type SettingsTenant } from "./settings-manager";

export const metadata: Metadata = { title: "Cài đặt — Booking Platform" };

export default async function SettingsPage() {
  const user = await requireRole("OWNER");

  if (!user.tenantId) {
    return (
      <div className="rounded-xl border border-blush-border bg-white p-8 text-center shadow-sm">
        <p className="font-display text-lg font-bold text-zinc-900">Chưa gắn cơ sở</p>
        <p className="mt-2 text-sm text-zinc-500">
          Tài khoản chưa được gắn với cơ sở nào. Hãy đăng ký cơ sở mới để bắt đầu.
        </p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      slug: true,
      name: true,
      businessType: true,
      confirmMode: true,
      timezone: true,
    },
  });
  if (!tenant) {
    return (
      <div className="rounded-xl border border-blush-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-zinc-500">Không tìm thấy thông tin cơ sở.</p>
      </div>
    );
  }

  // Staff list with link status. Linked emails are resolved to the linked
  // User's display name for a friendlier row (an orphan link — user deleted —
  // renders with an amber hint instead).
  const staffs = await prisma.staff.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, name: true, isActive: true, userEmail: true },
    orderBy: { name: "asc" },
  });
  const linkedEmails = staffs
    .map((s) => s.userEmail)
    .filter((e): e is string => e !== null);
  const linkedUsers = linkedEmails.length
    ? await prisma.user.findMany({
        where: { email: { in: linkedEmails } },
        select: { email: true, name: true },
      })
    : [];
  const nameByEmail = new Map(linkedUsers.map((u) => [u.email, u.name]));

  const tenantProps: SettingsTenant = {
    name: tenant.name,
    slug: tenant.slug,
    businessType: tenant.businessType,
    confirmMode: tenant.confirmMode,
    timezone: tenant.timezone,
  };
  const staffProps: SettingsStaff[] = staffs.map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.isActive,
    userEmail: s.userEmail,
    linkedUserName: s.userEmail ? (nameByEmail.get(s.userEmail) ?? null) : null,
  }));

  return <SettingsManager tenant={tenantProps} staffs={staffProps} />;
}
