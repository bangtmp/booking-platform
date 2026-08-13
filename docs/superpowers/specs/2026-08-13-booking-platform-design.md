# Booking Platform — Design Spec

**Ngày**: 2026-08-13
**Mục tiêu**: Portfolio project fullstack web + tiềm năng thu nhập (white-label/agency hoặc charge theo tháng).
**Phạm vi thời gian**: 1-2 tuần.

## Tóm tắt

SaaS multi-tenant đặt lịch cho dịch vụ cá nhân (salon, spa, phòng khám). Mỗi chủ tiệm có một workspace riêng (tenant) với slug duy nhất dùng làm URL đặt lịch công khai. Khách đặt lịch qua trang public; chủ tiệm quản lý dịch vụ, chuyên viên, lịch làm việc và booking qua dashboard. Thiết kế dùng chung cho nhiều loại hình dịch vụ.

## Kiến trúc

**Mô hình**: SaaS multi-tenant — một codebase, mỗi tiệm một workspace. Mọi truy vấn bắt buộc có điều kiện `tenantId`.

```
┌─────────────────────────────────────────────────┐
│  Next.js (App Router) — single codebase        │
│                                                 │
│  /(public)/  → trang đặt lịch công khai        │
│     /{tenantSlug}/booking                       │
│                                                 │
│  /(dashboard)/ → app quản lý (có auth)         │
│     /dashboard  → lịch, booking, dịch vụ       │
│                                                 │
│  Server Actions + Route Handlers + Prisma       │
│  ───────────────────────────────────────        │
│  Postgres: User, Tenant, Service,              │
│            Staff, Schedule, Booking            │
└─────────────────────────────────────────────────┘
```

**Tech stack**: Next.js (App Router) + Postgres + Prisma. Auth session-based (cookie, server-side guard).

## Vai trò và phân quyền

| Vai trò | Quyền |
|---------|-------|
| `ADMIN` | Quản trị nền tảng: xem toàn bộ, quản lý tiệm. Không thuộc tenant nào. |
| `OWNER` | Chủ tiệm: quản lý dịch vụ, chuyên viên, lịch làm việc, duyệt/hủy booking. |
| `STAFF` | Nhân viên: xem lịch của mình, cập nhật trạng thái booking của mình. |

Authorization: guard kiểm tra role + `tenantId` trước mọi action.

## Data model (Prisma)

```
User
  id, email, passwordHash, name, role (ADMIN/OWNER/STAFF)
  tenantId?            // null với ADMIN

Tenant
  id, slug (unique), name, businessType (SALON/SPA/CLINIC/OTHER)
  confirmMode (AUTO / MANUAL)   // tiệm tự chọn
  timezone, workingDays (JSON)

Service
  id, tenantId, name, price, durationMin, isActive

Staff
  id, tenantId, name, userId?, avatar, isActive

Schedule                      // lịch tuần lặp lại
  id, tenantId, staffId, dayOfWeek (0-6), startTime, endTime

Booking
  id, tenantId, staffId, serviceId, customerName,
  customerPhone, date, startTime, endTime,
  status (PENDING/CONFIRMED/CANCELLED/COMPLETED),
  note?, createdById?   // null khi khách tự đặt (không đăng nhập)
```

**Ràng buộc**:
- `Tenant.slug` unique → URL công khai `/booking/{slug}`.
- Chống trùng slot: kiểm tra `staffId + date + time range` trong transaction trước khi tạo Booking; unique index hỗ trợ.
- Mọi bảng (trừ User/ADMIN) bắt buộc `tenantId`; mọi query mang `tenantId` từ session (guard ở tầng data access) — chống leak data giữa các tiệm.
- `Schedule` theo `dayOfWeek` lặp lại hàng tuần (không theo từng ngày cụ thể).

## Luồng chính

### Luồng đặt lịch (public)
1. Khách vào `/booking/{slug}` → chọn dịch vụ.
2. Hiển thị staff + slot khả dụng (lọc theo `Schedule` của tuần, trừ slot có Booking `PENDING/CONFIRMED`). **Bắt buộc chọn staff** — mọi loại hình MVP đều đặt theo chuyên viên.
3. Khách nhập tên, SĐT → submit.
4. Server Action re-check slot còn trống trong transaction (chống double-booking) → tạo Booking (`createdById = null` vì khách không đăng nhập).
5. Theo `confirmMode` của tiệm:
   - `AUTO` → Booking `CONFIRMED` ngay.
   - `MANUAL` → Booking `PENDING`, chờ chủ tiệm duyệt.
6. Trả về trang xác nhận thành công kèm thời gian hẹn.

### Luồng quản lý (dashboard)
- Owner xem lịch theo ngày/tuần, lọc theo staff.
- Owner chuyển trạng thái: `PENDING→CONFIRMED`, `→CANCELLED`, `→COMPLETED`.
- Staff chỉ thấy/xử lý booking của mình. Admin xem toàn bộ tiệm.

## Xử lý lỗi trọng tâm

- **Double-booking**: re-check slot bên trong transaction; nếu trùng → trả lỗi rõ ràng + đề xuất slot khác.
- **Data leak multi-tenant**: mọi query mang `tenantId` từ session, guard ở tầng data access.
- **Authorization**: guard role trước mọi action.
- **Slot hết**: UI vô hiệu hóa slot đã đặt ngay khi render.

## Testing

- Unit test: logic check-slot (cốt lõi nhất).
- E2E: luồng đặt lịch public + luồng duyệt booking của owner.

## Ngoài phạm vi MVP

- Thanh toán online (VnPay/Momo).
- Reminder email/SMS/Zalo.
- Nhận xét đánh giá.
- Multi-branch (một tiệm nhiều chi nhánh).

## Tiềm năng thu nhập

- Bán white-label cho agency.
- Charge theo tháng (subscription).
- Source dùng làm nền cho dịch vụ freelance theo yêu cầu.
