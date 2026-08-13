"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DAY_NAMES_VN } from "@/lib/datetime";
import { saveSchedule, type ScheduleRowInput, type SaveScheduleResult } from "./actions";

export type StaffScheduleRow = {
  id: string;
  name: string;
  isActive: boolean;
  schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    active: boolean;
  }[];
};

type DaySchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  active: boolean;
};

type Message = { kind: "error" | "success"; text: string };

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

const primaryButton =
  "cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-50";
const timeInputClass =
  "rounded-lg border border-blush-border bg-white px-2 py-1.5 font-mono text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

/** HTML time inputs cap at 23:59; the engine's "24:00" sentinel is shown as 23:59. */
function timeInputValue(v: string | null): string {
  if (!v) return "";
  return v === "24:00" ? "23:59" : v;
}

function buildInitial(staff: StaffScheduleRow): DaySchedule[] {
  const byDay = new Map(staff.schedules.map((s) => [s.dayOfWeek, s]));
  return DAYS.map((day) => {
    const s = byDay.get(day);
    return {
      dayOfWeek: day,
      startTime: s?.startTime ?? DEFAULT_START,
      endTime: s?.endTime ?? DEFAULT_END,
      breakStart: timeInputValue(s?.breakStart ?? null),
      breakEnd: timeInputValue(s?.breakEnd ?? null),
      active: s?.active ?? true,
    };
  });
}

function ScheduleRow({
  row,
  onChange,
}: {
  row: DaySchedule;
  onChange: (next: DaySchedule) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-blush-border py-2.5 first:border-t-0">
      <span className="w-24 shrink-0 text-sm font-medium text-zinc-800">
        {DAY_NAMES_VN[row.dayOfWeek]}
      </span>

      <label className="flex items-center gap-1.5 text-xs text-zinc-500">
        Bắt đầu
        <input
          type="time"
          value={row.startTime}
          onChange={(e) => onChange({ ...row, startTime: e.target.value })}
          className={timeInputClass}
        />
      </label>
      <span className="text-zinc-400">–</span>
      <label className="flex items-center gap-1.5 text-xs text-zinc-500">
        Kết thúc
        <input
          type="time"
          value={row.endTime}
          onChange={(e) => onChange({ ...row, endTime: e.target.value })}
          className={timeInputClass}
        />
      </label>

      <label className="flex items-center gap-1.5 text-xs text-zinc-500">
        Nghỉ
        <input
          type="time"
          value={row.breakStart}
          onChange={(e) => onChange({ ...row, breakStart: e.target.value })}
          className={timeInputClass}
          aria-label={`Nghỉ bắt đầu ${DAY_NAMES_VN[row.dayOfWeek]}`}
        />
        <span className="text-zinc-400">–</span>
        <input
          type="time"
          value={row.breakEnd}
          onChange={(e) => onChange({ ...row, breakEnd: e.target.value })}
          className={timeInputClass}
          aria-label={`Nghỉ kết thúc ${DAY_NAMES_VN[row.dayOfWeek]}`}
        />
      </label>

      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600">
        <input
          type="checkbox"
          checked={row.active}
          onChange={(e) => onChange({ ...row, active: e.target.checked })}
          className="h-4 w-4 cursor-pointer rounded border-blush-border accent-primary"
        />
        Làm việc
      </label>
    </div>
  );
}

function StaffScheduleCard({ staff }: { staff: StaffScheduleRow }) {
  const router = useRouter();
  const [rows, setRows] = useState<DaySchedule[]>(() => buildInitial(staff));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  function onChange(index: number, next: DaySchedule) {
    setRows((prev) => prev.map((r, i) => (i === index ? next : r)));
  }

  async function onSave() {
    setBusy(true);
    setMessage(null);
    try {
      const input: ScheduleRowInput[] = rows.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        breakStart: r.breakStart || null,
        breakEnd: r.breakEnd || null,
        active: r.active,
      }));
      const res: SaveScheduleResult = await saveSchedule(staff.id, input);
      if (res.ok) {
        setMessage({ kind: "success", text: `Đã lưu lịch làm việc của ${staff.name}.` });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    } catch {
      setMessage({ kind: "error", text: "Đã xảy ra lỗi, vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  }

  const activeDays = rows.filter((r) => r.active).length;

  return (
    <div className="rounded-2xl border border-blush-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-semibold text-zinc-900">{staff.name}</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              staff.isActive ? "bg-emerald-100 text-emerald-700" : "bg-mist text-zinc-500"
            }`}
          >
            {staff.isActive ? "Đang hoạt động" : "Đã tắt"}
          </span>
        </div>
        <span className="text-xs text-zinc-500">
          {activeDays}/7 ngày làm việc
        </span>
      </div>

      {!staff.isActive && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Nhân viên này đang tắt — sẽ không hiển thị cho khách đặt lịch cho đến khi được bật lại.
        </p>
      )}

      <p className="mt-3 text-xs text-zinc-400">
        Khung giờ định dạng HH:mm. Bỏ chọn “Làm việc” để đóng cửa ngày đó. Để trống giờ nghỉ nếu không nghỉ.
      </p>

      <div className="mt-2">
        {rows.map((row, index) => (
          <ScheduleRow key={row.dayOfWeek} row={row} onChange={(next) => onChange(index, next)} />
        ))}
      </div>

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl px-3 py-2 text-sm ${
            message.kind === "error"
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onSave} disabled={busy} className={primaryButton}>
          {busy ? "Đang lưu…" : "Lưu lịch làm việc"}
        </button>
      </div>
    </div>
  );
}

export default function ScheduleManager({ staff }: { staff: StaffScheduleRow[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Lịch làm việc</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Thiết lập khung giờ làm việc theo ngày trong tuần cho từng nhân viên. Khách chỉ đặt được
          lịch trong các khung giờ này.
        </p>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-blush-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-600">
            Chưa có nhân viên nào. Vào trang{" "}
            <a href="/staff" className="font-medium text-primary underline">
              Nhân viên
            </a>{" "}
            để thêm nhân viên trước.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {staff.map((s) => (
            <StaffScheduleCard key={s.id} staff={s} />
          ))}
        </div>
      )}
    </div>
  );
}
