"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginForm({
  registeredEmail,
}: {
  registeredEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flash] = useState<string | null>(
    registeredEmail
      ? `Đăng ký thành công. Vui lòng đăng nhập bằng ${registeredEmail}.`
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Đăng nhập thất bại.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Đăng nhập</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Đăng nhập để quản lý cơ sở của bạn.
        </p>

        {flash && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {flash}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Mật khẩu
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline">
            Đăng ký cơ sở mới
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          <p className="font-medium text-zinc-600">Tài khoản demo (seed):</p>
          <p>admin@example.com / admin123</p>
          <p>owner@demo.com / owner123</p>
        </div>
      </div>
    </div>
  );
}
