import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { Placeholder } from "../_components/placeholder";

export const metadata: Metadata = { title: "Dịch vụ — Booking Platform" };

export default async function ServicesPage() {
  await requireRole("OWNER");
  return (
    <Placeholder
      title="Dịch vụ"
      description="Quản lý danh sách dịch vụ của cơ sở: thêm, sửa tên, giá và thời lượng. Tính năng sẽ được phát triển trong Task 7."
    />
  );
}
