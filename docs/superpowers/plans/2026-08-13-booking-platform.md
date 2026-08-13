# Booking Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SaaS multi-tenant đặt lịch cho salon/spa/phòng khám hoàn chỉnh trong 1-2 tuần (portfolio + tiềm năng white-label).

**Architecture:** Next.js App Router single codebase; mọi tenant có `tenantId` bắt buộc trong mọi query. Public booking page tại `/booking/{slug}`, dashboard quản lý có auth theo role (ADMIN/OWNER/STAFF). Chống double-booking bằng re-check overlap bên trong Prisma transaction.

**Tech Stack:** Next.js 15 (App Router, TS) + Postgres 16 (Docker) + Prisma + better-auth + Tailwind + shadcn/ui + Vitest + Playwright.

**Design system (từ ui-ux-pro-max):** Soft UI Evolution — Primary `#EC4899`, Background `#FDF2F8`, Accent `#8B5CF6`, Muted `#F1EEF5`, Border `#FBCFE8`, Destructive `#DC2626`. Typography: Playfair Display (heading) + Inter (body). Checklist: no emoji icons (SVG/Lucide), cursor-pointer trên clickable, hover 150-300ms, contrast 4.5:1, focus visible, prefers-reduced-motion, responsive 375/768/1024/1440.

## Global Constraints

- Time format: `HH:mm` (string, zero-padded). Date format: `YYYY-MM-DD` (string). No timezone conversion in MVP; `Tenant.timezone` default `Asia/Ho_Chi_Minh`.
- Mọi query dữ liệu tenant đều mang `tenantId` từ session (guard ở tầng action/layout) — chống data leak giữa các tiệm.
- Booking chỉ nhận `PENDING`/`CONFIRMED` làm slot bị chiếm. `CANCELLED`/`COMPLETED` không chiếm slot.
- Public booking bắt buộc chọn staff; `createdById = null` khi khách tự đặt.
- `Tenant.confirmMode`: `AUTO` → CONFIRMED ngay, `MANUAL` → PENDING chờ duyệt.
- UI text bằng tiếng Việt.
- Task cuối mỗi task: commit với conventional message.

---

### Task 1: Scaffold project

**Files:**
- Create: toàn bộ cây project Next.js tại `C:\Users\bangv\source\repos\booking-platform`
- Create: `docker-compose.yml`, `.env`, `.env.example`

**Steps:**
- [ ] `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` (không Prompt/Telemetry, không Turbopack riêng)
- [ ] `npm i @prisma/client better-auth`
- [ ] `npm i -D prisma vitest @playwright/test tsx`
- [ ] Tạo `docker-compose.yml`: postgres:16, POSTGRES_DB=booking, POSTGRES_USER=postgres, POSTGRES_PASSWORD=postgres, port 5432
- [ ] `.env`: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking?schema=public"`, `BETTER_AUTH_SECRET=...`, `BETTER_AUTH_URL=http://localhost:3000`
- [ ] `docker compose up -d` → Postgres chạy
- [ ] Verify: `npm run dev` chạy, `http://localhost:3000` hiển thị
- [ ] Commit: `chore: scaffold nextjs booking platform`

---

### Task 2: Prisma schema + migration + seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Modify: `package.json` (add `prisma.seed`, `db:migrate`, `db:seed` scripts)

**Schema** (model chính):
- `User`: id(cuid), email unique, passwordHash (better-auth: `password` — do better-auth quản lý; dùng trường riêng `name`, `role` enum ADMIN/OWNER/STAFF, `tenantId?`)
- `Tenant`: id, slug unique, name, businessType enum(SALON/SPA/CLINIC/OTHER), confirmMode enum(AUTO/MANUAL) default AUTO, timezone default "Asia/Ho_Chi_Minh"
- `Service`: id, tenantId, name, price Decimal(12,0), durationMin Int, isActive Bool default true
- `Staff`: id, tenantId, name, isActive Bool default true
- `Schedule`: id, tenantId, staffId, dayOfWeek Int (0-6), startTime, endTime
- `Booking`: id, tenantId, staffId, serviceId, customerName, customerPhone, date, startTime, endTime, status enum(PENDING/CONFIRMED/CANCELLED/COMPLETED) default PENDING, note?, createdById? ; `@@index([tenantId, date])`

Lưu ý better-auth: cần `next-auth` adapter — dùng `better-auth` database adapter cho Prisma (các model `user`, `session`, `account`, `verification`). Theo dõi [better-auth docs](https://www.better-auth.com) cho schema chính xác.

- [ ] Viết schema, `npx prisma migrate dev --name init`
- [ ] Seed: 1 admin, 1 tenant "Salon Ánh Sao" slug `demo` + owner + 2 staff + 3 service + schedule tuần
- [ ] Verify: `npx prisma db seed` không lỗi; `npx prisma studio` thấy data
- [ ] Commit: `feat: prisma schema, migration and seed`

---

### Task 3: better-auth + role guard

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-guard.ts`
- Modify: `src/app/layout.tsx` (thêm SessionProvider), tạo `/login`, `/register` pages + actions

- [ ] Config better-auth với email/password + Prisma adapter, cookie httpOnly
- [ ] `register`: tạo User role OWNER + Tenant (slug auto từ tên, suffix nếu trùng)
- [ ] `login`/`logout`
- [ ] `requireRole(...roles)` helper: đọc session, ném/redirect nếu sai role
- [ ] Verify: register → login → logout flow OK trên browser
- [ ] Commit: `feat: authentication with better-auth`

---

### Task 4: Slot logic (core) + unit test

**Files:**
- Create: `src/lib/availability.ts`, `tests/availability.test.ts`
- Modify: `package.json` (vitest config)

- [ ] Viết test (đỏ): `generateSlots`, `isOverlapping`, `availableSlots`
- [ ] Implement pure functions:
  - `generateSlots(dayStart, dayEnd, durationMin): string[]`
  - `isOverlapping(aStart, aEnd, bStart, bEnd): boolean`
  - `availableSlots(dayStart, dayEnd, durationMin, booked: {start,end}[]): string[]`
- [ ] Test pass (xanh)
- [ ] Commit: `feat: slot availability logic`

---

### Task 5: Public booking page

**Files:**
- Create: `src/app/(public)/booking/[slug]/page.tsx`, `src/app/(public)/booking/[slug]/actions.ts`, component BookingFlow (client)

- [ ] Server component load tenant (slug) + services active + staff active + schedules
- [ ] UI Soft UI: chọn dịch vụ → chọn staff → chọn ngày → chọn slot → form tên/SĐT/note
- [ ] Action `getAvailableSlots(tenantSlug, staffId, date)` → trả slot còn trống
- [ ] Action `createBooking(...)` → validate zod → re-check overlap trong `prisma.$transaction` → tạo theo confirmMode → trả về success page
- [ ] Trùng slot → lỗi "Slot vừa được đặt" + đề xuất slot khác
- [ ] Verify browser: đặt lịch thành công; double-booking bị chặn
- [ ] Commit: `feat: public booking page`

---

### Task 6: Dashboard shell + guard

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/page.tsx` (placeholder), sidebar nav

- [ ] Layout: require session + tenant; nav theo role
- [ ] OWNER: services/staff/schedule/bookings/settings; STAFF: chỉ bookings (của mình); ADMIN: admin panel
- [ ] Verify: truy cập sai role bị chặn
- [ ] Commit: `feat: dashboard shell with role guard`

---

### Task 7: Services CRUD

**Files:**
- Create: `src/app/(dashboard)/services/page.tsx`, `src/app/(dashboard)/services/actions.ts`

- [ ] Liệt kê service của tenant; form tạo/sửa/xóa (tên, giá, durationMin, isActive)
- [ ] Server actions scoped `tenantId` từ session; OWNER-only
- [ ] Verify browser
- [ ] Commit: `feat: service management`

---

### Task 8: Staff CRUD + Schedule

**Files:**
- Create: `src/app/(dashboard)/staff/page.tsx`, `actions.ts`, `src/app/(dashboard)/schedule/page.tsx`, `actions.ts`

- [ ] Staff: thêm/sửa/xóa/toggle active (name, isActive)
- [ ] Schedule: mỗi staff chọn dayOfWeek + start/end (nhiều hàng)
- [ ] OWNER-only
- [ ] Verify browser
- [ ] Commit: `feat: staff and schedule management`

---

### Task 9: Lịch tuần + quản lý booking

**Files:**
- Create: `src/app/(dashboard)/bookings/page.tsx`, `actions.ts` (status transition)

- [ ] Lịch tuần: hiển thị booking theo ngày, lọc staff, màu theo status
- [ ] Action `updateBookingStatus(id, status)`: guard tenant + role (STAFF chỉ booking của mình), transition hợp lệ
- [ ] Verify browser: duyệt PENDING→CONFIRMED, hủy, hoàn tất
- [ ] Commit: `feat: booking management with week view`

---

### Task 10: Tenant settings

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`, `actions.ts`

- [ ] Sửa tenant: name, businessType, confirmMode
- [ ] Verify: đổi confirmMode MANUAL → booking mới ra PENDING
- [ ] Commit: `feat: tenant settings`

---

### Task 11: Admin panel

**Files:**
- Create: `src/app/(dashboard)/admin/page.tsx`

- [ ] Danh sách tenant (name, slug, businessType, confirmMode, created), ADMIN-only
- [ ] Commit: `feat: admin tenant list`

---

### Task 12: Playwright e2e

**Files:**
- Create: `tests/e2e/booking.spec.ts`, `playwright.config.ts`

- [ ] E2E 1: đặt lịch public thành công (tenant `demo`)
- [ ] E2E 2: owner login → duyệt booking PENDING→CONFIRMED
- [ ] Verify: `npx playwright test` pass
- [ ] Commit: `test: e2e booking flows`

---

### Task 13: Landing page + polish + README

**Files:**
- Create: `src/app/page.tsx` (landing hero), `README.md`

- [ ] Landing theo Hero-Centric pattern + Soft UI
- [ ] README: setup, scripts, kiến trúc, tính năng
- [ ] Verify: build production `npm run build` pass
- [ ] Commit: `chore: landing page and docs`
