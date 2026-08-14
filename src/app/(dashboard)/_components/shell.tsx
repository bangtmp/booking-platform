"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: string;
};

type ShellProps = {
  nav: DashboardNavItem[];
  tenantName: string;
  userName: string;
  userRoleLabel: string;
  publicBookingUrl?: string;
  isDemo?: boolean;
  children: React.ReactNode;
};

const iconClass = "h-5 w-5 shrink-0";

const ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M12 3l1.9 4.9L18.8 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5.2 9.8l4.9-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="7" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
      <path d="M14 3h7v7" />
      <path d="M21 3l-9 9" />
      <path d="M17 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

export function Shell({
  nav,
  tenantName,
  userName,
  userRoleLabel,
  publicBookingUrl,
  isDemo,
  children,
}: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function onLogout() {
    setLoggingOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
      isActive(href)
        ? "bg-primary/10 text-primary-deep"
        : "text-zinc-600 hover:bg-mist hover:text-zinc-900"
    }`;

  return (
    <div className="min-h-screen bg-blush text-zinc-900">
      {isDemo && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
          Bản demo – chỉ xem
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-blush-border bg-white/80 backdrop-blur md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-blush-border px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            {ICONS.sparkles}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">{tenantName}</p>
            <p className="text-[11px] text-zinc-500">Booking Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {ICONS[item.icon]}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {publicBookingUrl && (
          <div className="border-t border-blush-border p-3">
            <a
              href={publicBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-mist"
            >
              {ICONS.external}
              <span>Trang đặt lịch công khai</span>
            </a>
            <p className="mt-1 truncate px-3 text-[11px] text-zinc-400">{publicBookingUrl}</p>
          </div>
        )}
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-blush-border bg-white/80 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-glow md:hidden">
              {ICONS.sparkles}
            </span>
            <p className="truncate text-sm font-bold text-zinc-900 md:text-base">{tenantName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-zinc-900">{userName}</p>
              <p className="text-xs text-zinc-500">{userRoleLabel}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut || isDemo}
              title={isDemo ? "Bản demo chỉ xem" : undefined}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-blush-border bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-mist disabled:opacity-60"
            >
              {ICONS.logout}
              <span>{loggingOut ? "Đang thoát…" : "Đăng xuất"}</span>
            </button>
          </div>
        </header>

        {nav.length > 1 && (
          <nav className="flex gap-1 overflow-x-auto border-b border-blush-border bg-white/60 px-3 py-2 md:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {ICONS[item.icon]}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default Shell;
