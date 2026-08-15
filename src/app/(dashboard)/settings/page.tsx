import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { repo } from "@/lib/repo";
import { DEMO_TENANT } from "@/demo/seed-data";
import SettingsManager, { type SettingsStaff, type SettingsTenant } from "./settings-manager";

export const metadata: Metadata = { title: "Cài đặt — Booking Platform" };

export default async function SettingsPage() {
  const user = await requireRole("OWNER");
  const isDemo = process.env.DEMO_MODE === "true";
  const tenantId = isDemo ? DEMO_TENANT.id : user.tenantId;

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-blush-border bg-white p-8 text-center shadow-sm">
        <p className="font-display text-lg font-bold text-zinc-900">Chưa gắn cơ sở</p>
        <p className="mt-2 text-sm text-zinc-500">
          Tài khoản chưa được gắn với cơ sở nào. Hãy đăng ký cơ sở mới để bắt đầu.
        </p>
      </div>
    );
  }

  const tenant = await repo.tenant.findById(tenantId);
  if (!tenant) {
    return (
      <div className="rounded-xl border border-blush-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-zinc-500">Không tìm thấy thông tin cơ sở.</p>
      </div>
    );
  }

  const staffs = await repo.staff.listByTenant(tenantId);
  const staffProps: SettingsStaff[] = staffs.map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.isActive,
    userEmail: s.userEmail ?? null,
    linkedUserName: null,
  }));

  const tenantProps: SettingsTenant = {
    name: tenant.name,
    slug: tenant.slug,
    businessType: tenant.businessType,
    confirmMode: tenant.confirmMode,
    timezone: tenant.timezone,
  };

  return <SettingsManager tenant={tenantProps} staffs={staffProps} />;
}
