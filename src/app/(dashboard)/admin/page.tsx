import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { Placeholder } from "../_components/placeholder";

export const metadata: Metadata = { title: "Quản trị — Booking Platform" };

export default async function AdminPage() {
  await requireRole("ADMIN");
  return (
    <Placeholder
      title="Quản trị"
      description="Danh sách các cơ sở đang sử dụng nền tảng: tên, slug, loại hình và chế độ xác nhận. Tính năng sẽ được phát triển trong Task 11."
    />
  );
}
