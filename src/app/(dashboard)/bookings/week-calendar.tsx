"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDays } from "@/lib/datetime";
import { updateBookingStatus } from "./actions";

export type CalendarDay = {
  date: string;
  dayName: string;
  short: string;
  isToday: boolean;
};

export type CalendarStaff = { id: string; name: string; isActive: boolean };

export type CalendarBooking = {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  customerName: string;
  service: { name: string } | null;
};

type WeekCalendarProps = {
  days: CalendarDay[];
  staffs: CalendarStaff[];
  bookings: CalendarBooking[];
  closedDays: Record<string, number[]>;
  weekStart: string;
  confirmMode: "AUTO" | "MANUAL";
  isOwner: boolean;
};

type BookingStatus = CalendarBooking["status"];

const STATUS_META: Record<
  BookingStatus,
  { label: string; border: string; chip: string; muted?: boolean }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    border: "border-amber-400",
    chip: "bg-amber-100 text-amber-800",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    border: "border-emerald-500",
    chip: "bg-emerald-100 text-emerald-800",
  },
  COMPLETED: {
    label: "Hoàn tất",
    border: "border-violet-400",
    chip: "bg-violet-100 text-violet-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    border: "border-zinc-300",
    chip: "bg-zinc-100 text-zinc-500",
    muted: true,
  },
};

function dowIndex(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return 0;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
}

function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const fmt = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

const actionBtn =
  "cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtn =
  "bg-primary/10 text-primary-deep hover:bg-primary/20";
const dangerBtn = "bg-red-50 text-red-600 hover:bg-red-100";
const neutralBtn = "bg-zinc-100 text-zinc-600 hover:bg-zinc-200";

export default function WeekCalendar({
  days,
  staffs,
  bookings,
  closedDays,
  weekStart,
  confirmMode,
  isOwner,
}: WeekCalendarProps) {
  const router = useRouter();
  const [hiddenStaff, setHiddenStaff] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const bookingsByCell = useMemo(() => {
    const map: Record<string, CalendarBooking[]> = {};
    for (const b of bookings) {
      const key = `${b.staffId}|${b.date}`;
      (map[key] ??= []).push(b);
    }
    return map;
  }, [bookings]);

  const visibleStaffs = useMemo(
    () => staffs.filter((s) => !hiddenStaff[s.id]),
    [staffs, hiddenStaff],
  );

  async function act(bookingId: string, status: BookingStatus) {
    setActing(`${bookingId}:${status}`);
    setNotice(null);
    const result = await updateBookingStatus(bookingId, status);
    setActing(null);
    if (!result.ok) {
      setNotice({ ok: false, text: result.error });
      return;
    }
    setNotice({ ok: true, text: "Đã cập nhật trạng thái." });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Lịch hẹn tuần</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          {confirmMode === "MANUAL" && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Booking mới cần duyệt thủ công
            </span>
          )}
          <Link
            href={`/bookings?start=${addDays(weekStart, -7)}`}
            className="cursor-pointer rounded-lg border border-blush-border bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-mist"
          >
            Tuần trước
          </Link>
          <Link
            href="/bookings"
            className="cursor-pointer rounded-lg border border-blush-border bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-mist"
          >
            Tuần này
          </Link>
          <Link
            href={`/bookings?start=${addDays(weekStart, 7)}`}
            className="cursor-pointer rounded-lg border border-blush-border bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-mist"
          >
            Tuần sau
          </Link>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-lg px-3 py-2 text-sm ${
            notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      )}

      {isOwner && staffs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Lọc nhân viên:</span>
          {staffs.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={!hiddenStaff[s.id]}
              onClick={() =>
                setHiddenStaff((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
              }
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                hiddenStaff[s.id]
                  ? "bg-zinc-100 text-zinc-400"
                  : "bg-primary/10 text-primary-deep hover:bg-primary/20"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {staffs.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-zinc-500">
          Chưa có nhân viên nào trong cơ sở.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-blush-border bg-white shadow-sm">
          <div
            className="grid"
            style={{ gridTemplateColumns: "150px repeat(7, minmax(190px, 1fr))" }}
          >
            <div className="sticky left-0 z-10 border-b border-blush-border bg-white px-3 py-2 text-xs font-semibold text-zinc-500">
              Nhân viên
            </div>
            {days.map((day) => (
              <div
                key={day.date}
                className={`border-b border-l border-blush-border px-3 py-2 ${
                  day.isToday ? "bg-primary/5" : "bg-white"
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    day.isToday ? "text-primary-deep" : "text-zinc-900"
                  }`}
                >
                  {day.dayName}
                  {day.isToday && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Hôm nay
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-zinc-500">{day.short}</p>
              </div>
            ))}

            {visibleStaffs.map((staff) => {
              const closedDows = new Set(closedDays[staff.id] ?? []);
              return (
                <div key={staff.id} className="contents">
                  <div className="sticky left-0 z-10 border-b border-blush-border bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-900">{staff.name}</p>
                    {!staff.isActive && (
                      <p className="text-[11px] text-zinc-400">Đã tắt</p>
                    )}
                  </div>
                  {days.map((day) => {
                    const key = `${staff.id}|${day.date}`;
                    const cell = bookingsByCell[key] ?? [];
                    const isClosed = closedDows.has(dowIndex(day.date));
                    return (
                      <div
                        key={day.date}
                        className={`min-h-[84px] border-b border-l border-blush-border p-1.5 ${
                          day.isToday ? "bg-primary/5" : "bg-white"
                        }`}
                      >
                        {isClosed && cell.length === 0 ? (
                          <p className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-400">
                            Nghỉ
                          </p>
                        ) : cell.length === 0 ? (
                          <p className="px-2 py-1 text-[11px] text-zinc-300">—</p>
                        ) : (
                          <div className="space-y-1.5">
                            {isClosed && (
                              <p className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-400">
                                Nghỉ (đóng cửa)
                              </p>
                            )}
                            {cell.map((b) => {
                              const meta = STATUS_META[b.status];
                              return (
                                <div
                                  key={b.id}
                                  className={`rounded-lg border-l-4 bg-white px-2 py-1.5 shadow-sm ${meta.border}`}
                                >
                                  <p className="text-[11px] font-semibold text-zinc-900">
                                    {b.startTime}–{b.endTime}
                                  </p>
                                  <p
                                    className={`text-xs font-medium text-zinc-800 ${
                                      meta.muted ? "line-through" : ""
                                    }`}
                                  >
                                    {b.customerName}
                                  </p>
                                  <p className="truncate text-[11px] text-zinc-500">
                                    {b.service?.name ?? ""}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1">
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.chip}`}>
                                      {meta.label}
                                    </span>
                                  </div>
                                  {b.status === "PENDING" && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {confirmMode === "MANUAL" && (
                                        <button
                                          type="button"
                                          disabled={acting !== null}
                                          onClick={() => act(b.id, "CONFIRMED")}
                                          className={`${actionBtn} ${primaryBtn}`}
                                        >
                                          Duyệt
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        disabled={acting !== null}
                                        onClick={() => act(b.id, "CANCELLED")}
                                        className={`${actionBtn} ${dangerBtn}`}
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  )}
                                  {b.status === "CONFIRMED" && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      <button
                                        type="button"
                                        disabled={acting !== null}
                                        onClick={() => act(b.id, "COMPLETED")}
                                        className={`${actionBtn} ${neutralBtn}`}
                                      >
                                        Hoàn tất
                                      </button>
                                      <button
                                        type="button"
                                        disabled={acting !== null}
                                        onClick={() => act(b.id, "CANCELLED")}
                                        className={`${actionBtn} ${dangerBtn}`}
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="font-medium">Chú thích:</span>
        {Object.values(STATUS_META).map((meta) => (
          <span key={meta.label} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full border ${meta.border} bg-white`} />
            {meta.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-zinc-100" />
          Nghỉ (không có lịch)
        </span>
      </div>
    </div>
  );
}
