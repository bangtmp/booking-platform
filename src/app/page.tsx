import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPriceVn } from "@/lib/datetime";

const DEMO_TENANT_SLUG = "demo";

type Service = { id: string; name: string; price: string; durationMin: number };

async function getDemoServices(): Promise<Service[]> {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: DEMO_TENANT_SLUG } });
    if (!tenant) return [];
    const rows = await prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { price: "asc" },
      take: 3,
    });
    return rows.map((s) => ({ id: s.id, name: s.name, price: s.price.toString(), durationMin: s.durationMin }));
  } catch {
    return [];
  }
}

const STEPS = [
  {
    num: "1",
    title: "Chọn dịch vụ",
    desc: "Duyệt qua danh sách dịch vụ và chọn thứ bạn cần, kèm thời gian và giá rõ ràng.",
  },
  {
    num: "2",
    title: "Chọn thời gian",
    desc: "Chọn ngày và khung giờ trống phù hợp — lịch được cập nhật theo thời gian thực.",
  },
  {
    num: "3",
    title: "Xác nhận",
    desc: "Điền thông tin liên hệ và nhận mã đặt lịch ngay. Đơn giản, không cần tài khoản.",
  },
];

export default async function Home() {
  const services = await getDemoServices();

  return (
    <div className="flex min-h-dvh flex-col bg-blush font-sans">
      <header className="sticky top-0 z-20 border-b border-blush-border/60 bg-blush/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-bold text-primary-deep">
            Booking Platform
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/booking/demo" className="text-zinc-600 transition-colors hover:text-primary-deep">
              Đặt lịch
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-deep"
            >
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 sm:py-32">
            <span className="rounded-full border border-blush-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Đặt lịch trực tuyến
            </span>
            <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-balance text-zinc-900 sm:text-6xl">
              Hẹn giờ với{" "}
              <span className="text-primary-deep">cơ sở yêu thích của bạn</span>
            </h1>
            <p className="max-w-xl text-base text-zinc-600 sm:text-lg">
              Chọn dịch vụ, chọn khung giờ trống và xác nhận trong vài phút — không cần
              gọi điện, không cần chờ đợi.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking/demo"
                className="rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-primary-deep"
              >
                Đặt lịch ngay
              </Link>
              <Link
                href="/booking/demo"
                className="rounded-xl border border-blush-border bg-white px-7 py-3.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-primary hover:text-primary-deep"
              >
                Xem lịch trống
              </Link>
            </div>
            <p className="text-xs text-zinc-400">
              Đang xem thử với cơ sở mẫu{" "}
              <span className="font-medium text-zinc-600">Salon Ánh Sao</span> —{" "}
              <Link href="/register" className="font-medium text-primary hover:text-primary-deep">
                đăng ký
              </Link>{" "}
              để tạo không gian riêng của bạn
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Dịch vụ nổi bật
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold text-zinc-900">
                Khởi đầu với những dịch vụ phổ biến
              </h2>
              <p className="mt-2 text-xs text-zinc-400">
                Dữ liệu demo từ cơ sở mẫu Salon Ánh Sao
              </p>
            </div>
            {services.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1 rounded-2xl border border-blush-border bg-blush/50 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="text-sm text-zinc-500">{s.durationMin} phút</p>
                    <h3 className="font-display text-xl font-bold text-zinc-900">{s.name}</h3>
                    <p className="mt-auto pt-3 text-lg font-bold text-primary-deep">
                      {formatPriceVn(s.price)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-zinc-500">
                Không tìm thấy dịch vụ. Vui lòng kiểm tra lại sau.
              </p>
            )}
          </div>
        </section>

        <section className="bg-white/50">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Chỉ 3 bước
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold text-zinc-900">
                Đặt lịch dễ dàng như đếm 1-2-3
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="relative rounded-2xl border border-blush-border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="font-display text-4xl font-bold text-primary/30">
                    {step.num}
                  </span>
                  <h3 className="mt-3 font-semibold text-zinc-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-blush via-white to-mist">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-bold text-primary-deep sm:text-4xl">
              Sẵn sàng đặt lịch?
            </h2>
            <p className="max-w-lg text-sm text-zinc-600 sm:text-base">
              Hãy để chúng tôi lo phần còn lại — từ nay việc hẹn lịch chỉ mất vài phút.
            </p>
            <Link
              href="/booking/demo"
              className="rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-primary-deep"
            >
              Đặt lịch ngay
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-blush-border bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <p className="font-display font-semibold text-zinc-700">Booking Platform</p>
          <p>© {new Date().getFullYear()} Booking Platform. Mọi quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
