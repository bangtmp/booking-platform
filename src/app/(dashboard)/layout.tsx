import { Playfair_Display } from "next/font/google";
import { requireUser, type UserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { requireMockUser } from "@/lib/auth-mock";
import { DEMO_TENANT } from "@/demo/seed-data";
import { Shell, type DashboardNavItem } from "./_components/shell";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const NAV_BY_ROLE: Record<UserRole, DashboardNavItem[]> = {
  ADMIN: [{ href: "/admin", label: "Quản trị", icon: "shield" }],
  OWNER: [
    { href: "/dashboard", label: "Tổng quan", icon: "home" },
    { href: "/services", label: "Dịch vụ", icon: "sparkles" },
    { href: "/staff", label: "Nhân viên", icon: "users" },
    { href: "/schedule", label: "Lịch làm việc", icon: "calendar" },
    { href: "/bookings", label: "Lịch hẹn", icon: "bookmark" },
    { href: "/settings", label: "Cài đặt", icon: "settings" },
  ],
  STAFF: [{ href: "/bookings", label: "Lịch hẹn", icon: "calendar" }],
};

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  OWNER: "Chủ cơ sở",
  STAFF: "Nhân viên",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = process.env.DEMO_MODE === "true";
  const user = isDemo ? requireMockUser() : await requireUser();
  const role = user.role as UserRole;
  const tenant =
    isDemo && user.tenantId === DEMO_TENANT.id
      ? DEMO_TENANT
      : user.tenantId
        ? await prisma.tenant.findUnique({ where: { id: user.tenantId } })
        : null;

  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const publicBookingUrl = tenant ? `${origin}/booking/${tenant.slug}` : undefined;

  return (
    <div className={`${playfair.variable} font-sans`}>
      <Shell
        nav={NAV_BY_ROLE[role] ?? []}
        tenantName={tenant?.name ?? "Booking Platform"}
        userName={user.name}
        userRoleLabel={ROLE_LABEL[role]}
        publicBookingUrl={publicBookingUrl}
      >
        {children}
      </Shell>
    </div>
  );
}
