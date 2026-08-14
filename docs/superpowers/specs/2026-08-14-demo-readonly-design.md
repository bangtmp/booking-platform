# Booking Platform — Demo Readonly Fork

**Ngày**: 2026-08-14
**Mục tiêu**: Tạo bản fork demo deploy lên Vercel, không cần database ngoài, toàn bộ ứng dụng chỉ cho xem, không cho chỉnh sửa hay tạo dữ liệu mới.
**Phạm vi**: Thay đổi được giữ trong nhánh `demo-readonly`, không ảnh hưởng `main`.

## Tóm tắt

Branch `demo-readonly` là một phiên bản giới hạn của booking platform:
- Không cần `DATABASE_URL` hay database bên ngoài.
- Dữ liệu được hardcode trong code (`src/demo/seed-data.ts`).
- Auth bị thay thế bằng mock auto-login trong demo mode.
- Tất cả mutations đều bị chặn ở server actions.
- UI hiển thị banner read-only và vô hiệu hóa các nút thêm/sửa/xóa.
- Deploy lên Vercel chỉ cần set `DEMO_MODE=true`.

## Kiến trúc

```
┌─────────────────────────────────────────────────┐
│  Next.js (App Router) — demo-readonly branch    │
│                                                 │
│  DEMO_MODE=true                                 │
│  ├── src/lib/repo.ts            → đọc static data│
│  ├── src/lib/auth-mock.ts       → auto-login    │
│  ├── src/lib/read-only-guard.ts → chặn mutations│
│  └── src/demo/seed-data.ts      → dữ liệu mẫu  │
│                                                 │
│  /booking/{slug}            → xem public        │
│  /dashboard/*               → xem dashboard     │
└─────────────────────────────────────────────────┘
```

Khi `DEMO_MODE=false` hoặc không set, toàn bộ các module trên rơi về behavior production gốc (Prisma + better-auth).

## Thay đổi chi tiết

### 1. Data-access abstraction

Tạo `src/lib/repo.ts` với interface:

```ts
export const repo = {
  tenant: {
    findBySlug: (slug: string) => Promise<Tenant | null>,
  },
  service: {
    listByTenant: (tenantId: string) => Promise<Service[]>,
  },
  staff: {
    listByTenant: (tenantId: string) => Promise<Staff[]>,
  },
  schedule: {
    listByTenantStaff: (tenantId: string, staffId: string) => Promise<Schedule[]>,
  },
  booking: {
    listByTenantDate: (tenantId: string, date: string) => Promise<Booking[]>,
    create: (data: CreateBookingInput) => Promise<Booking>,
  },
};
```

- **Production**: `repo` gọi Prisma client trực tiếp.
- **Demo**: `repo` đọc từ `src/demo/seed-data.ts` theo từng interface.
- Mọi file hiện đang dùng Prisma trực tiếp sẽ được chuyển qua `repo`.

### 2. Demo seed data

Tạo `src/demo/seed-data.ts` chứa:
- 1 tenant mẫu: `slug = demo`, `name = Salon Demo`.
- 3-4 services: cắt tóc, uốn, nhuộm, chăm sóc da.
- 3 staffs với schedules cố định.
- 10-15 bookings trong tuần hiện tại/tuần tới để người xem thấy dữ liệu thật.
- Dữ liệu được viết dạng TypeScript object rồi export qua các hàm finder/getter, không dùng Prisma.

### 3. Auth mock

Tạo `src/lib/auth-mock.ts`:
- Demo mode: `requireUser()` trả user giả với:
  - role: `OWNER`
  - tenantId: trùng tenant demo
  - name: `Demo Owner`
- Các helper khác (`getSession`, `requireUser`, ...) vẫn hoạt động, chỉ trả về session giả.
- Dashboard vẫn render, nhưng không có thao tác thật nào behind nó.

### 4. Read-only guard

Tạo `src/lib/read-only-guard.ts`:
- Kiểm tra `process.env.DEMO_MODE === 'true'`.
- Nếu đúng và action là mutation → ném lỗi `Read-only demo` ngay server-side.
- Áp dụng vào tất cả server actions:
  - `src/app/(dashboard)/bookings/actions.ts`
  - `src/app/(dashboard)/services/actions.ts`
  - `src/app/(dashboard)/staff/actions.ts`
  - `src/app/(dashboard)/schedule/actions.ts`
  - `src/app/(dashboard)/settings/actions.ts`
  - `src/app/(public)/booking/[slug]/actions.ts`

### 5. UI/UX changes

- Thêm banner nhỏ ở dashboard: “Bản demo – chỉ xem”.
- Vô hiệu hóa các nút thêm/sửa/xóa trong UI.
- Public booking page: disable nút “Đặt lịch”.
- Nếu mutation bị chặn backend, UI hiển thị thông báo rõ ràng: “Bản demo không hỗ trợ chỉnh sửa.”

### 6. Cấu hình

Sửa `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

Sửa `.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/booking?schema=public
BETTER_AUTH_SECRET=replace-with-a-random-base64url-string
BETTER_AUTH_URL=http://localhost:3000
DEMO_MODE=false
```

Sửa `README.md`:
- Giới thiệu rõ đây là nền tảng đặt lịch multi-tenant.
- Ghi rõ có 2 chế độ: `production` và `demo-readonly`.
- Hướng dẫn chạy local production.
- Hướng dẫn chạy local demo: `DEMO_MODE=true npm run dev`.
- Hướng dẫn deploy demo lên Vercel: chọn branch `demo-readonly`, set `DEMO_MODE=true`, không cần database.

### 7. Vercel deployment

- Vercel project gắn với branch `demo-readonly`.
- Environment Variables:
  - `DEMO_MODE = true`
- Không cần `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` trong demo mode.

## Migration strategy

- Tất cả thay đổi nằm trong nhánh `demo-readonly`.
- `main` giữ nguyên, không đụng đến.
- Sau này muốn đưa cải tiến từ demo về `main` thì merge/rebase như bình thường.

## Checklist implementation

- [ ] Tạo `src/lib/repo.ts` + wire production/demo
- [ ] Tạo `src/lib/auth-mock.ts`
- [ ] Tạo `src/lib/read-only-guard.ts`
- [ ] Tạo `src/demo/seed-data.ts`
- [ ] Chuyển tất cả Prisma calls sang `repo`
- [ ] Chèn banner read-only vào dashboard shell
- [ ] Disable mutations trong UI
- [ ] Chặn mutations trong public booking actions
- [ ] Cập nhật `next.config.ts`
- [ ] Cập nhật `.env.example`
- [ ] Viết lại `README.md`
- [ ] Verify: local demo `DEMO_MODE=true npm run dev` hoạt động
- [ ] Verify: dashboard chỉ đọc, không ghi được
- [ ] Verify: deploy Vercel từ branch `demo-readonly`
