import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { Placeholder } from "../_components/placeholder";

export const metadata: Metadata = { title: "Nhân viên — Booking Platform" };

export default async function StaffPage() {
  await requireRole("OWNER");
  return (
    <Placeholder
      title="Nhân viên"
      description="Thêm, sửa, xóa và bật/tắt trạng thái hoạt động của nhân viên. Tính năng sẽ được phát triển trong Task 8."
    />
  );
}
