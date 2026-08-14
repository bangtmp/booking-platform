# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Chủ tiệm nhỏ tại Việt Nam (đối tượng chính)** — chủ salon/spa/phòng khám cá nhân, không có đội IT, cần một trang đặt lịch online và dashboard quản lý hàng ngày: dịch vụ, nhân viên, lịch làm việc, xác nhận/hủy booking.
- **Khách đặt lịch (người dùng cuối)** — vào trang public qua link `/booking/{slug}`, chọn dịch vụ + nhân viên + khung giờ, để lại tên và số điện thoại; không cần tài khoản.
- **Nhân viên (STAFF)** — xem lịch và xử lý booking của riêng mình.
- **Admin nền tảng (ADMIN)** — quản trị toàn bộ tiệm, không thuộc tenant nào.
- **Agency/white-label (thứ yếu)** — kênh phân phối tiềm năng: sản phẩm được bán lại/brand lại cho nhiều tiệm.

## Product Purpose

SaaS multi-tenant đặt lịch cho dịch vụ cá nhân (salon, spa, phòng khám). Chủ tiệm có một workspace riêng (tenant) với slug duy nhất làm URL đặt lịch công khai; khách đặt lịch không cần tài khoản. Thành công nghĩa là sản phẩm portfolio chứng minh năng lực fullstack, đồng thời để ngỏ khả năng thu nhập (white-label cho agency hoặc charge theo tháng).

## Positioning

Mỗi tiệm một workspace cô lập (mọi dữ liệu gắn `tenantId`), URL đặt lịch công khai riêng, không cần cài đặt hay IT — một codebase phục vụ nhiều loại hình dịch vụ khác nhau bằng chung một luồng đặt lịch.

## Operating Context

- Chủ tiệm đăng nhập, quản lý dịch vụ (tên, giá VND, thời lượng), nhân viên, lịch tuần lặp lại (theo `dayOfWeek`), xem booking theo ngày/tuần, chuyển trạng thái `PENDING → CONFIRMED → COMPLETED` hoặc `CANCELLED`.
- Mỗi tiệm tự chọn chế độ xác nhận: `AUTO` (khách đặt là xác nhận ngay) hoặc `MANUAL` (chờ chủ tiệm duyệt).
- Khách đặt lịch theo 3 bước: chọn dịch vụ → chọn nhân viên + ngày + khung giờ → nhập tên, SĐT, ghi chú.
- Chống double-booking: re-check slot trong transaction, unique index trên (staff, date, startTime) cho booking PENDING/CONFIRMED.
- Chống data leak giữa các tiệm: mọi query mang `tenantId` từ session, guard ở tầng data access.

## Capabilities and Constraints

- Vai trò: `ADMIN` (quản trị nền tảng), `OWNER` (chủ tiệm), `STAFF` (nhân viên, chỉ thấy booking của mình). Guard role + `tenantId` trước mọi action.
- Loại hình tiệm: `SALON`, `SPA`, `CLINIC`, `OTHER` — thiết kế dùng chung, không đặc thù hóa theo loại hình.
- Đơn vị tiền: VND; múi giờ mặc định `Asia/Ho_Chi_Minh`.
- Mọi bảng (trừ User/ADMIN) bắt buộc `tenantId`.
- Khách tự đặt có `createdById = null` (không đăng nhập).
- Slot hết chỗ bị vô hiệu hóa ngay khi render; double-booking trả lỗi rõ ràng kèm đề xuất slot khác.
- Chưa quyết định (ngoài MVP): thanh toán online (VnPay/Momo), reminder email/SMS/Zalo.
- Đã quyết định là hướng mở rộng gần, chưa chi tiết hóa: đánh giá/feedback và multi-branch (một tiệm nhiều chi nhánh).

## Brand Commitments

- Toàn bộ nội dung người dùng bằng tiếng Việt (UI copy, format ngày/giờ/giá).
- Tên dự án: booking-platform (tên làm việc, chưa có brand chính thức).
- Không có khách hàng, testimonial, đánh giá, số liệu bán hàng hay benchmark nào là thật — không được bịa.

## Evidence on Hand

- Design spec: `docs/superpowers/specs/2026-08-13-booking-platform-design.md`.
- Kế hoạch triển khai: `docs/superpowers/plans/2026-08-13-booking-platform.md`.
- Demo seed: `prisma/seed.ts` (tenant "demo" và "manual", tài khoản admin/owner/staff).
- E2E: `tests/e2e/booking.spec.ts`; unit tests trong `src/lib/__tests__/`.
- Schema dữ liệu: `prisma/schema.prisma`.

## Product Principles

1. **Multi-tenant an toàn tuyệt đối** — cô lập dữ liệu giữa các tiệm là yêu cầu cốt lõi; không đánh đổi vì giao diện hay hiệu năng.
2. **Luồng đặt lịch không cần giải thích** — khách không đăng nhập, phải hoàn tất trong vài phút trên điện thoại.
3. **Chống sai sót thay vì chống lỗi hiển thị** — slot trùng, booking trùng phải chặn ở tầng dữ liệu, không chỉ ở UI.
4. **Chủ tiệm làm việc bằng tiếng Việt thực dụng** — giá trị nằm ở tiết kiệm thời gian quản lý hàng ngày.
5. **Chung một cơ chế, mở cho mọi loại hình** — thiết kế phục vụ salon, spa, phòng khám mà không đặc thù hóa.
