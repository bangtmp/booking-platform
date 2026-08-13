import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { Placeholder } from "../_components/placeholder";

export const metadata: Metadata = { title: "Lịch làm việc — Booking Platform" };

export default async function SchedulePage() {
  await requireRole("OWNER");
  return (
    <Placeholder
      title="Lịch làm việc"
      description="Thiết lập khung giờ làm việc theo ngày trong tuần cho từng nhân viên. Tính năng sẽ được phát triển trong Task 8."
    />
  );
}
