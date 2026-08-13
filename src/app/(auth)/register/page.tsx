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

export default function RegisterPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState("");
  const [businessType, setBusinessType] = useState("SALON");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">
          Đăng ký cơ sở mới
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tạo tài khoản chủ cơ sở và không gian quản lý riêng.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
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
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "Đang tạo…" : "Đăng ký và đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
