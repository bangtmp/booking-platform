"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerTenant } from "@/app/(auth)/actions";
import { authClient } from "@/lib/auth-client";

const BUSINESS_TYPES = [
  { value: "SALON", label: "Salon" },
  { value: "SPA", label: "Spa" },
  { value: "CLINIC", label: "Phòng khám" },
  { value: "OTHER", label: "Khác" },
];

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l1.9 4.9L18.8 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5.2 9.8l4.9-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState("");
  const [businessType, setBusinessType] = useState("SALON");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isDemo) {
      setError("Bản demo chỉ cho phép đăng nhập, không hỗ trợ đăng ký cơ sở mới.");
      setLoading(false);
      return;
    }

    const result = await registerTenant({
      tenantName,
      businessType,
      email,
      password,
      displayName,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const signIn = await authClient.signIn.email({ email, password });
    if (signIn.error) {
      const retry = await authClient.signIn.email({ email, password });
      if (retry.error) {
        router.push(`/login?registered=${encodeURIComponent(email)}`);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  const fieldClass =
    "rounded-xl border border-blush-border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blush via-white to-mist px-4 py-12">
      <div className="pointer-events-none absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-blush-border bg-white p-8 shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>

        <h1 className="font-display mt-5 text-center text-2xl font-bold text-zinc-900">
          Đăng ký cơ sở mới
        </h1>
        <p className="mt-1.5 text-center text-sm text-zinc-500">
          Tạo tài khoản chủ cơ sở và không gian quản lý riêng.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Tên cơ sở
            <input
              required
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="VD: Salon Ánh Sao"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Loại hình kinh doanh
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={fieldClass}
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Tên hiển thị
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Mật khẩu
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-primary-deep disabled:opacity-50"
          >
            {loading ? "Đang tạo…" : "Đăng ký và đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-deep">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
