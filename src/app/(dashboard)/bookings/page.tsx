import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { Placeholder } from "../_components/placeholder";

export const metadata: Metadata = { title: "Lịch hẹn — Booking Platform" };

export default async function BookingsPage() {
  await requireRole("OWNER", "STAFF");
  return (
    <Placeholder
      title="Lịch hẹn"
      description="Xem lịch tuần, duyệt và cập nhật trạng thái đặt lịch. Tính năng sẽ được phát triển trong Task 9."
    />
  );
}
