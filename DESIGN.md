---
name: Booking Platform
description: Nền tảng đặt lịch trực tuyến đa tiệm cho salon, spa và phòng khám — warm, duyên dáng, trang nhã
colors:
  primary: "#ec4899"
  primary-deep: "#db2777"
  accent: "#8b5cf6"
  background: "#fff8fb"
  blush: "#fdf2f8"
  blush-border: "#fbcee8"
  mist: "#f1eef5"
  foreground: "#171717"
  text-muted: "#71717a"
  success: "#047857"
  success-bg: "#ecfdf5"
  warning: "#b45309"
  warning-bg: "#fffbeb"
  error: "#dc2626"
  error-bg: "#fef2f2"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "14px"
  micro:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-lg:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "#52525b"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  card:
    backgroundColor: "#ffffff"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
  badge:
    rounded: "{rounded.full}"
---

# Design System: Booking Platform

## Overview

**Creative North Star: "Lời Chào Nồng Ấm"**

Mỗi màn hình của Booking Platform phải đọc như một lời chào đón chu đáo của một tiệm dịch vụ tốt: ấm áp, duyên dáng, trân trọng từng khách, nhưng không bao giờ phô trương. Đây là không gian nơi chủ tiệm làm việc mỗi ngày và khách đặt lịch trong vài phút — hệ thống chọn sự thoải mái thay vì ấn tượng, sự tin cậy thay vì tiếng ồn.

Giọng thẩm mỹ là **ấm và duyên**: bảng màu hồng-tím trên nền blush sữa gợi sự mềm mại của cánh hoa và ánh sáng cửa tiệm buổi sớm, trong khi chữ serif Playfair cho tiêu đề và sans Geist cho thân chữ tạo nên sự đối lập tinh tế giữa sang trọng và thực dụng. Về mật độ, hệ thống thoải mái: các thành phần thở bằng khoảng trắng, không nhồi nhét. Thành phần UI theo tinh thần **trang nhã, kiềm chế** — bo tròn dịu, bóng đổ mềm tint màu, màu sắc dành cho điểm nhấn thay vì phủ kín.

Hệ thống phục vụ hai trải nghiệm cùng một ngôn ngữ: trang đặt lịch công khai (ấm áp, lễ nghi, thiên về serif) và dashboard quản lý (gọn gàng, lưới rõ, thiên về sans). Sự khác biệt là về mật độ và khối lượng chữ, không phải về bảng màu hay chất liệu.

**Key Characteristics:**
- Nền sữa hồng (`#fff8fb`) với bề mặt trắng, không dùng nền hồng đặc phủ toàn màn hình.
- Một điểm nhấn hồng tươi (`#ec4899`) + một đồng hành tím oải hương (`#8b5cf6`); cả hai dành cho hành động và dấu ấn, không cho văn bản dài.
- Serif Playfair chỉ ở tiêu đề; thân chữ, label, bảng dùng sans Geist.
- Bo tròn mềm mọi bề mặt (8–24px), badge hình viên thuốc.
- Bóng đổ luôn tint hồng/tím, nhẹ nhàng; đường viền hồng phấn làm công việc phân định cấu trúc.
- Phản hồi trạng thái bằng các tông pastel ngữ nghĩa (emerald/amber/red) trên nền nhạt.

## Colors

Bảng màu ấm áp, dịu dàng: hồng hoa hồng làm nhịp chính, tím oải hương làm nốt đồng hành, và các tông neutral nghiêng về hồng/sương để mọi bề mặt đều "mềm" ngay cả khi trung tính.

### Primary
- **Hồng Hoa Hồng** (#ec4899): màu hành động chính. Nút primary, link trong trang công khai, chip bước đang chọn, badge "Hôm nay", điểm nhấn focus. Chỉ dùng cho hành động và dấu ấn ngắn — không bao giờ cho đoạn văn bản.
- **Hồng Đậm** (#db2777): trạng thái hover/active của Hồng Hoa Hồng, chữ giá tiền trong dashboard, chữ trên nền nhạt hồng.

### Secondary
- **Tím Oải Hương** (#8b5cf6): nốt đồng hành. Gradient logo, link "Trang đặt lịch công khai", quầng nền trang login. Không dùng làm màu hành động chính.

### Neutral
- **Giấy Sữa** (#fff8fb): nền nền body và trang công khai.
- **Hồng Sương** (#fdf2f8): nền sidebar/header, nền card demo, nền vùng trang public.
- **Viền Hồng Phấn** (#fbcee8): đường viền cấu trúc — border của card, input, bảng, divider. Đây là "cây thước" phân định bố cục.
- **Sương Khói Tím** (#f1eef5): nền nhạt thứ hai — hover của nav/ghost button, nền header bảng, chip inactive.
- **Mực Đêm** (#171717): chữ chính (zinc-900).
- **Xám Bồ Câu** (#71717a → #a1a1aa): chữ phụ (zinc-500/400), placeholder.

### Status (ngữ nghĩa, dùng kèm nền pastel)
- **Lục Lá Non** (#047857 trên nền #ecfdf5): thành công, dịch vụ đang hoạt động, booking CONFIRMED.
- **Hổ Phách** (#b45309 trên nền #fffbeb): cảnh báo, chờ xử lý, booking PENDING.
- **Đỏ Gạch** (#dc2626 trên nền #fef2f2): lỗi, nguy hiểm, booking CANCELLED.
- **Tím Nhạt** (nền #ede9fe): booking COMPLETED.

### Named Rules
**The One Accent Rule.** Hồng Hoa Hồng chỉ hiện diện ở điểm nhấn — chiếm ≤ ~10% diện tích bất kỳ màn hình nào. Sự hiếm hoi của nó chính là sức mạnh; một màn hình ngập hồng là màn hình mất phép.

**The Blush Field Rule.** Vùng nền lớn dùng Giấy Sữa hoặc Hồng Sương, không bao giờ dùng màu accent đặc full-bleed. Hồng/tím chỉ lấn sân qua gradient logo, quầng sáng và điểm nhấn nhỏ.

**The Pink Line Rule.** Viền cấu trúc luôn là Viền Hồng Phấn (#fbcee8), không dùng xám trung tính cho border — nhờ đó cả màn hình trung tính vẫn giữ hơi ấm.

## Typography

**Display Font:** Playfair Display (serif, load qua `next/font/google`, biến `--font-playfair`)
**Body Font:** Geist (sans, biến `--font-geist-sans`)
**Label/Mono Font:** Geist Mono (biến `--font-geist-mono`) — dùng cho mã tham chiếu booking, khung giờ slot, số liệu.

**Character:** Cặp đôi serif-sans tạo nên sự duyên dáng có trọng lượng: Playfair mang hơi thở spa/salon cao cấp cho tiêu đề, Geist đảm bảo độ rõ ràng thực dụng cho thông tin. Giọng chung là ấm, không trang trọng căng thẳng; theo sau bởi mật độ thoải mái và chiều dài dòng có kiểm soát.

### Hierarchy
- **Display** (Playfair, 700, 30px → 36px, line-height ~1.1): tiêu đề trang công khai — tên cơ sở, "Đặt lịch thành công". Chỉ dùng serif cho cấp này và Headline.
- **Headline** (Playfair, 700, 24px, line-height ~1.2): tiêu đề trang dashboard ("Dịch vụ", "Lịch hẹn tuần", "Cài đặt").
- **Title** (Geist, 600, 18px): tiêu đề card và tiêu đề section dạng form.
- **Body** (Geist, 400, 14px, line-height 1.5): nội dung chính, mô tả, ô input. Màu Mực Đêm hoặc Xám Bồ Câu tùy mức ưu tiên.
- **Label** (Geist, 500, 12px): label form, chip trạng thái, caption bảng.
- **Micro** (Geist, 500, 10–12px, có thể uppercase + tracking-wide): header bảng, giờ trong lịch, chip trạng thái nhỏ trong calendar, chú thích — cấp nhỏ nhất dành riêng cho dữ liệu dày (lịch tuần, bảng), luôn nét vừa phải không quá nhạt.

Khoảng cách chữ (letter-spacing) gần như không dùng ngoài header bảng; không in hoa thay thế phân cấp. Chiều dài dòng thân chữ giới hạn ~65–75ch trong card.

### Named Rules
**The Serif Ceiling Rule.** Playfair chỉ dành cho Display và Headline. Label, body, bảng, nút — mọi thứ dưới tiêu đề — dùng Geist. Serif làm việc "kiêu" hơn mức thân chữ; để nó lấn xuống là mất cân bằng.

**The Single Voice Rule.** Mỗi màn hình có một giọng chữ chính; không trộn serif với sans trong cùng một câu hay trộn nhiều size không nhất quán cho cùng một vai trò.

## Layout

Hai bộ khung: công khai và quản lý.

**Công khai:** dựng trên cột giữa hẹp có tâm — flow đặt lịch `max-w-2xl`, màn hình thành công `max-w-xl`, đều `px-4 py-10` trên mobile, `sm:py-14` trên desktop. Toàn bộ nội dung nằm trong một card trắng bo `rounded-3xl` (24px) với `shadow-md`, nổi trên nền Hồng Sương. Trình tự 3 bước dùng thanh step nằm ngang giữa card.

**Quản lý (dashboard):** sidebar cố định 256px trên `md+` (trắng mờ, backdrop-blur, viền phải Viền Hồng Phấn); trên mobile sidebar thu gọn thành header + thanh nav ngang scroll ngang. Nội dung `p-4 md:p-8`. Lưới 12 của Tailwind với các pattern lặp lại:
- Card form: `grid-cols-1` → `sm:grid-cols-2`.
- Lưới dịch vụ công khai: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Slot giờ: `grid-cols-3 sm:grid-cols-4`.
- Bảng dữ liệu: `min-w-[640px]` trong `overflow-x-auto`, không vỡ layout mobile.
- Lịch tuần: `150px + 7 × minmax(190px, 1fr)`, cột đầu sticky trái.

Nhịp spacing 4px (Tailwind): khoảng cách thành phần trong card `gap-4`, giữa các section `space-y-6`, header trang `space-y-6`/`gap-3`. Mật độ thoải mái, không dùng dòng 32px hay khoảng cách 2px.

## Elevation & Depth

Triết lý là **lai nhẹ, theo hiện trạng**: bề mặt phẳng do đường viền phân định, bóng đổ chỉ chạy ở tầng "nổi" — card chính, bảng chính, login, và các yếu tố cần tách khỏi nền. Bóng luôn tint hồng/tím theo hai hue của palette (`rgb(219 39 119)` và `rgb(139 92 246)`), không bao giờ là bóng đen phẳng; đó là thứ giữ cho chiều sâu vẫn ấm.

### Shadow Vocabulary
- **Bóng Nghỉ** (`shadow-sm`: `0 1px 2px 0 rgb(219 39 119 / .04), 0 1px 3px 0 rgb(219 39 119 / .07)`): card booking trong lịch, phần tử nhỏ cần tách nhẹ.
- **Bóng Card** (`shadow-md`: `0 2px 4px -1px rgb(219 39 119 / .06), 0 8px 20px -6px rgb(219 39 119 / .10)`): card chính — flow công khai, bảng dịch vụ, lịch tuần, form.
- **Bóng Nổi** (`shadow-lg`: `0 10px 28px -8px rgb(219 39 119 / .12), 0 20px 60px -16px rgb(219 39 119 / .16)`): lớp cao nhất — card login, modal.
- **Glow Hồng** (`shadow-glow`: `0 8px 20px -6px rgb(219 39 119 / .40)`): quầng cho logo gradient và CTA chủ lực (nút đăng nhập, logo sidebar) — điểm sáng duy nhất được phép rực rỡ.
- **Bóng Nổi Tím** (`shadow-float`: `0 12px 32px -10px rgb(139 92 246 / .25), 0 28px 72px -16px rgb(236 72 153 / .30)`): dự trữ cho các lớp hover/card nổi bật; chưa thấy dùng phổ biến.

### Named Rules
**The Soft Shadow Rule.** Mọi bóng đổ pha theo hue hồng (`#db2777`) hoặc tím (`#8b5cf6`); cấm bóng `rgba(0,0,0,·)` thuần. Bóng là nguồn hơi ấm, không phải nguồn tương phản.

**The Flat-By-Default Rule.** Thành phần nghỉ ngơi thì phẳng (chỉ có viền); bóng xuất hiện khi có lý do nổi (card chính, hover, dialog). Không đè bóng lên mọi thứ.

## Shapes

Ngôn ngữ hình khối là **mềm mại, bo tròn dịu** — mọi bề mặt có góc cong, không góc vuông sắc nào hiện diện:
- Nút, link nav, chip nhỏ: `rounded-lg` (8px).
- Input, thông báo, card nhỏ, chip trạng thái dạng pill nhỏ, badge "Hôm nay": `rounded-xl` (12px) hoặc `rounded-full`.
- Card chính: `rounded-2xl` (16px).
- Card công khai / login / màn hình thành công: `rounded-3xl` (24px).
- Badge, pill lọc, ô step indicator: `rounded-full` (viên thuốc).

Dấu hiệu nhận diện đặc trưng: **viền trái màu trạng thái 4px** (`border-l-4`) trên card booking trong lịch tuần — màu báo trạng thái ngay từ cạnh (amber PENDING, emerald CONFIRMED, violet COMPLETED, xám CANCELLED). Logo là khối vuông bo `rounded-xl` gradient hồng→tím với icon nét stroke 1.8.

### Named Rules
**The Soft Corner Rule.** Không có góc vuông 0px trong hệ thống. Nếu một bề mặt tương tác được, nó phải có bán kính ≥ 8px; cấp nền lớn càng cong càng thân thiện.

**The Status Edge Rule.** Trạng thái booking sống trên viền trái 4px — một mảnh màu nhỏ ở cạnh, không phủ màu lên toàn card.

## Components

### Buttons
- **Shape:** bo 8–12px (nút lớn công khai 12px), không border cho nút primary, có viền cho nút ghost.
- **Primary:** nền Hồng Hoa Hồng, chữ trắng 600, padding `8px 16px` (dashboard) / `12px 24px` (công khai); login dùng kèm `shadow-glow`. Hover → Hồng Đậm. Focus ring hồng offset 2px. Disabled: opacity 50%.
- **Hover / Focus:** chuyển màu nền `transition-colors 150–200ms`, không dịch chuyển hay scale; focus luôn có `focus-visible:ring-2`.
- **Ghost / Secondary:** nền trắng, viền Viền Hồng Phấn, chữ zinc-600, hover nền Sương Khói Tím.
- **Danger:** bản ghost viền đỏ + chữ đỏ (hủy thao tác); bản solid nền Đỏ Gạch chữ trắng (xác nhận xóa, "Chắc chắn xóa?").

### Chips / Badges
- **Style:** pill `rounded-full`, nền pastel theo trạng thái — Lục Lá Non (active/confirmed), Hổ Phách (pending), Đỏ (cancelled), Xám (inactive), Violet (completed), Sương Khói Tím (inactive trung tính). Chữ cùng hue đậm hơn, `text-xs font-medium`.
- **State:** chip lọc nhân viên trong lịch — chọn: nền `primary/10` chữ Hồng Đậm; bỏ chọn: nền xám nhạt chữ nhạt hơn.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (16px) dashboard, `rounded-3xl` (24px) công khai/login.
- **Background:** trắng; card demo/summary dùng Hồng Sương hoặc `bg-mist`.
- **Border:** Viền Hồng Phấn 1px.
- **Shadow Strategy:** Bóng Card (`shadow-md`) cho card chính; card phụ trong trang có thể chỉ viền.
- **Internal Padding:** `p-5 sm:p-6` dashboard, `p-5 sm:p-8` công khai.

### Inputs / Fields
- **Style:** nền trắng, viền Viền Hồng Phấn, bo 12px, padding `10px 12px`, placeholder Xám Bồ Câu.
- **Focus:** viền chuyển Hồng Hoa Hồng + `ring-2` hồng 20% — không glow lớn, không đổi nền.
- **Error / Disabled:** không có kiểu error riêng cho input; lỗi báo qua thông báo đỏ phía trên. Checkbox/radio dùng `accent-primary`.

### Navigation
- **Sidebar (desktop):** 256px, trắng 80% + backdrop-blur, viền phải Viền Hồng Phấn; logo đầu (gradient hồng→tím, glow) + tên cơ sở; link nav: `rounded-lg`, padding `10px 12px`, text-sm medium. Active: nền `primary/10` chữ Hồng Đậm; idle: chữ zinc-600, hover nền Sương Khói Tím.
- **Mobile:** header + thanh nav ngang scroll `overflow-x-auto`.
- **Link trang công khai** trong sidebar: chữ Tím Oải Hương.

### Tables
- Nằm trong card trắng `shadow-md`; header `bg-mist/40`, chữ `text-xs uppercase tracking-wide`, nét semibold; cell `px-4 py-3`; row viền dưới Viền Hồng Phấn; dòng bị tắt (inactive) `bg-mist/30` + chữ mờ. Giá tiền nổi bật bằng Hồng Đậm.

### Status Messages
- `rounded-xl`, nền pastel: emerald cho thành công, red cho lỗi, amber cho cảnh báo; text-sm, chữ cùng hue đậm. Đặt ngay dưới header trang hoặc trên form.

### Step Indicator (trang đặt lịch công khai — signature)
Ba ô tròn 28px: xong → nền Hồng Hoa Hồng icon check trắng; đang ở → nền Hồng Đậm; chưa tới → nền Sương Khói Tím chữ zinc-500. Nối bằng thanh gradient hồng→tím. Nhãn step chỉ hiện từ `sm+`.

### Lịch Tuần (dashboard — signature)
Lưới nhân viên × 7 ngày, card booking trong ô là khối trắng nhỏ `rounded-lg`, **viền trái 4px theo trạng thái**, giờ bằng `font-mono`, tên khách semibold, service truncate, chip trạng thái nhỏ. Hôm nay: nền `primary/5` + badge "Hôm nay" hồng. Ngày nghỉ: mảnh xám nhạt "Nghỉ". Chú thích dưới lưới bằng chấm tròn màu status.

## Do's and Don'ts

### Do:
- **Do** dùng Hồng Hoa Hồng cho hành động chính và dấu ấn ngắn, và để các tông trung tính ấm gánh phần còn lại của màn hình.
- **Do** bo tròn mọi bề mặt: ≥8px cho tương tác, 16–24px cho card chính, pill cho badge.
- **Do** dùng Viền Hồng Phấn cho mọi border cấu trúc để giữ hơi ấm kể cả ở vùng trung tính.
- **Do** dùng Playfair chỉ cho Display/Headline và Geist cho mọi thứ còn lại.
- **Do** báo trạng thái bằng nền pastel + chữ cùng hue đậm (emerald/amber/red/violet).
- **Do** tint bóng đổ theo hue hồng/tím và để bóng ở tầng nổi, không phủ toàn trang.
- **Do** giữ bảng dữ liệu cuộn ngang trên mobile (`overflow-x-auto`) thay vì thu nhỏ chữ.

### Don't:
- **Don't** phủ Hồng Hoa Hồng lên văn bản dài hay nền lớn — sự hiếm hoi của nó là phép thuật.
- **Don't** dùng bóng đen phẳng `rgba(0,0,0,…)`; bóng phải tint màu.
- **Don't** dùng góc vuông sắc 0px cho bất kỳ bề mặt tương tác nào.
- **Don't** dùng serif cho label, body, bảng hay nút.
- **Don't** đổi màu viền cấu trúc sang xám trung tính — mất hơi ấm nền.
- **Don't** trộn nhiều cấp chữ không nhất quán cho cùng một vai trò (một giọng chữ mỗi màn hình).
