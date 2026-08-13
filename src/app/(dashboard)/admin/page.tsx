import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Quản trị — Booking Platform" };

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  SALON: "Salon tóc",
  SPA: "Spa & chăm sóc sức khỏe",
  CLINIC: "Phòng khám",
  OTHER: "Khác",
};

const CONFIRM_MODE_LABEL: Record<string, string> = {
  AUTO: "Tự động xác nhận",
  MANUAL: "Xác nhận thủ công",
};

export default async function AdminPage() {
  await requireRole("ADMIN");

  const tenants = await prisma.tenant.findMany({
    select: { name: true, slug: true, businessType: true, confirmMode: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Danh sách cơ sở</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tất cả cơ sở đang sử dụng nền tảng — {tenants.length} cơ sở
        </p>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-xl border border-blush-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Chưa có cơ sở nào đăng ký.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-blush-border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-blush-border text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-semibold">Tên cơ sở</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 font-semibold">Loại hình</th>
                <th className="px-5 py-3 font-semibold">Chế độ xác nhận</th>
                <th className="px-5 py-3 font-semibold">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.slug} className="border-b border-blush-border last:border-b-0 hover:bg-mist">
                  <td className="px-5 py-3 font-medium text-zinc-900">{t.name}</td>
                  <td className="px-5 py-3">
                    <code className="rounded bg-mist px-2 py-1 text-xs text-zinc-700">{t.slug}</code>
                  </td>
                  <td className="px-5 py-3 text-zinc-700">
                    {BUSINESS_TYPE_LABEL[t.businessType] ?? t.businessType}
                  </td>
                  <td className="px-5 py-3 text-zinc-700">
                    {CONFIRM_MODE_LABEL[t.confirmMode] ?? t.confirmMode}
                  </td>
                  <td className="px-5 py-3 text-zinc-700">
                    {t.createdAt.toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
