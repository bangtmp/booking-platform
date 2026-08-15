import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { repo } from "@/lib/repo";
import { DEMO_TENANT } from "@/demo/seed-data";
import { formatDateVn, tenantNow } from "@/lib/datetime";

export const metadata: Metadata = { title: "Tổng quan — Booking Platform" };

export default async function DashboardHomePage() {
  const user = await requireRole("OWNER");
  const isDemo = process.env.DEMO_MODE === "true";
  const tenantId = isDemo && user.tenantId === DEMO_TENANT.id ? DEMO_TENANT.id : user.tenantId;
  const tenant = tenantId ? await repo.tenant.findById(tenantId) : null;
  if (!tenant) {
    const fallback = { name: "Cơ sở chưa cấu hình", timezone: "Asia/Ho_Chi_Minh", slug: "booking" } as const;
    const today = tenantNow(fallback.timezone).date;
    const stats = [
      { label: "Lịch hẹn hôm nay", value: 0, hint: formatDateVn(today) },
      { label: "Chờ xác nhận", value: 0, hint: "cần xử lý" },
      { label: "Dịch vụ đang bán", value: 0, hint: "đang hoạt động" },
      { label: "Nhân viên", value: 0, hint: "đang hoạt động" },
    ];
    const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const publicUrl = `${origin}/booking/${fallback.slug}`;
    return <DashboardStats tenantName={fallback.name} today={today} stats={stats} publicUrl={publicUrl} />;
  }

  const today = tenantNow(tenant.timezone).date;
  const [todayBookings, allBookings, services, staffs] = await Promise.all([
    repo.booking.listByTenantDate(tenant.id, today),
    repo.booking.listByTenant(tenant.id),
    repo.service.listByTenant(tenant.id),
    repo.staff.listByTenant(tenant.id),
  ]);
  const todayCount = todayBookings.length;
  const pendingCount = allBookings.filter((b) => b.status === "PENDING").length;
  const servicesCount = services.filter((s) => s.isActive).length;
  const staffCount = staffs.filter((s) => s.isActive).length;

  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const publicUrl = `${origin}/booking/${tenant.slug}`;

  const stats = [
    { label: "Lịch hẹn hôm nay", value: todayCount, hint: formatDateVn(today) },
    { label: "Chờ xác nhận", value: pendingCount, hint: "cần xử lý" },
    { label: "Dịch vụ đang bán", value: servicesCount, hint: "đang hoạt động" },
    { label: "Nhân viên", value: staffCount, hint: "đang hoạt động" },
  ];

  return <DashboardStats tenantName={tenant.name} today={today} stats={stats} publicUrl={publicUrl} />;
}

function DashboardStats({
  tenantName,
  today,
  stats,
  publicUrl,
}: {
  tenantName: string;
  today: string;
  stats: { label: string; value: number; hint: string }[];
  publicUrl: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">
          Chào mừng trở lại, {tenantName}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tổng quan hoạt động của {tenantName} — {formatDateVn(today)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-blush-border bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
            <p className="text-sm font-medium text-zinc-500">{s.label}</p>
            <p className="font-display mt-2 text-3xl font-bold text-primary-deep">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-blush-border bg-white p-5 shadow-md lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">Đường dẫn đặt lịch công khai</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Chia sẻ đường dẫn này để khách hàng đặt lịch trực tuyến.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-mist px-3 py-2 text-sm text-zinc-800">{publicUrl}</code>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-deep"
            >
              Xem trang đặt lịch
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/bookings"
            className="block cursor-pointer rounded-2xl border border-blush-border bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-zinc-900">Quản lý lịch hẹn</p>
            <p className="mt-1 text-sm text-zinc-600">
              Xem lịch tuần, duyệt và cập nhật trạng thái đặt lịch.
            </p>
          </Link>
          <Link
            href="/services"
            className="block cursor-pointer rounded-2xl border border-blush-border bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-zinc-900">Quản lý dịch vụ</p>
            <p className="mt-1 text-sm text-zinc-600">
              Thêm, sửa giá và thời lượng của các dịch vụ.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
