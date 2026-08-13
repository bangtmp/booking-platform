import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { Placeholder } from "../_components/placeholder";

export const metadata: Metadata = { title: "Cài đặt — Booking Platform" };

export default async function SettingsPage() {
  await requireRole("OWNER");
  return (
    <Placeholder
      title="Cài đặt"
      description="Chỉnh sửa thông tin cơ sở: tên, loại hình kinh doanh và chế độ xác nhận đặt lịch. Tính năng sẽ được phát triển trong Task 10."
    />
  );
}
