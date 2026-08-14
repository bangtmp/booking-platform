import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDateVn, tenantNow } from "@/lib/datetime";

export const metadata: Metadata = { title: "Tổng quan — Booking Platform" };

export default async function DashboardHomePage() {
  const user = await requireRole("OWNER");
  if (!user.tenantId) redirect("/settings");
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!tenant) redirect("/settings");

  const today = tenantNow(tenant.timezone).date;
  const [todayCount, pendingCount, servicesCount, staffCount] = await Promise.all([
    prisma.booking.count({ where: { tenantId: tenant.id, date: today } }),
    prisma.booking.count({ where: { tenantId: tenant.id, status: "PENDING" } }),
    prisma.service.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.staff.count({ where: { tenantId: tenant.id, isActive: true } }),
  ]);

  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const publicUrl = `${origin}/booking/${tenant.slug}`;

  const stats = [
    { label: "Lịch hẹn hôm nay", value: todayCount, hint: formatDateVn(today) },
    { label: "Chờ xác nhận", value: pendingCount, hint: "cần xử lý" },
    { label: "Dịch vụ đang bán", value: servicesCount, hint: "đang hoạt động" },
    { label: "Nhân viên", value: staffCount, hint: "đang hoạt động" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">
          Chào mừng trở lại, {user.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tổng quan hoạt động của {tenant.name} — {formatDateVn(today)}
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
