"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

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
    router.push("/dashboard");
    router.refresh();
  }

  const fieldClass =
    "rounded-xl border border-blush-border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blush via-white to-mist px-4 py-12">
      <div className="pointer-events-none absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-3xl border border-blush-border bg-white p-8 shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>

        <h1 className="font-display mt-5 text-center text-2xl font-bold text-zinc-900">
          Đăng nhập
        </h1>
        <p className="mt-1.5 text-center text-sm text-zinc-500">
          Đăng nhập để quản lý cơ sở của bạn.
        </p>

        {flash && (
          <p className="mt-5 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {flash}
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
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
              className={fieldClass}
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
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-primary-deep disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-deep">
            Đăng ký cơ sở mới
          </Link>
        </p>

        <div className="mt-6 rounded-xl border border-blush-border bg-blush px-3 py-2 text-xs text-zinc-500">
          <p className="font-medium text-zinc-600">Tài khoản demo (seed):</p>
          <p>admin@example.com / admin123</p>
          <p>owner@demo.com / owner123</p>
        </div>
      </div>
    </div>
  );
}
