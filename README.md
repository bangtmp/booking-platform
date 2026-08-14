# Booking Platform

Nền tảng đặt lịch hẹn đa cửa hàng cho salon, spa và phòng khám.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ](#công-nghệ)
- [Chạy local](#chạy-local)
  - [Production mode](#production-mode)
  - [Demo mode](#demo-mode)
- [Deploy](#deploy)
  - [Vercel (demo)](#vercel-demo)
  - [Vercel (production)](#vercel-production)
- [Lưu ý](#lưu-ý)

## Tổng quan

- Khách đặt lịch công khai theo từng cửa hàng (`/booking/{slug}`).
- Chủ cửa hàng quản lý dịch vụ, nhân viên, lịch làm việc và lịch hẹn qua dashboard.
- Hỗ trợ xác nhận tự động hoặc thủ công theo cấu hình của từng cửa hàng.

## Công nghệ

- Next.js 16 + App Router
- Prisma + PostgreSQL
- better-auth
- Tailwind CSS

## Chạy local

### Yêu cầu

- Node.js >= 18
- PostgreSQL >= 14 (chỉ cần cho production)
- npm

### Production mode

1. Cài đặt dependencies:

```bash
npm install
```

2. Tạo file `.env` từ `.env.example` và điền đầy đủ các biến môi trường.
3. Chạy migrate + seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Chạy dev server:

```bash
npm run dev
```

5. Mở [http://localhost:3000](http://localhost:3000).

### Demo mode

Demo mode dùng dữ liệu cứng trong code, không cần database.

1. Tạo file `.env` với:

```bash
DEMO_MODE=true
```

2. Chạy dev server:

```bash
npm run dev
```

3. Mở [http://localhost:3000](http://localhost:3000).

Trong demo mode:
- Bạn sẽ được auto-login với quyền xem dashboard.
- Mọi thao tác thêm/sửa/xóa đều bị chặn.
- Dữ liệu hiển thị là dữ liệu mẫu cố định.

## Deploy

### Vercel (demo)

1. Tạo nhánh `demo-readonly` từ `main` và đẩy lên GitHub.
2. Trong Vercel, tạo project mới và chọn nhánh `demo-readonly`.
3. Thêm Environment Variable:
   - `DEMO_MODE = true`
4. Deploy.

Bản demo không cần database hay biến môi trường khác.

### Vercel (production)

1. Chuẩn bị database PostgreSQL bên ngoài, ví dụ Neon, Supabase, Render, Railway.
2. Tạo project trên Vercel từ nhánh `main`.
3. Thêm Environment Variables:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
4. Chạy migrate + seed lên database của bạn.
5. Deploy.

## Lưu ý

- `npm run build` hiện build được Next.js, nhưng Prisma generate nên được kiểm tra lại trước khi deploy production.
- Trong demo mode, `npm run db:migrate` và `npm run db:seed` không cần chạy.
