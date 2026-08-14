"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateVn } from "@/lib/datetime";
import {
  createStaff,
  deleteStaff,
  toggleStaffActive,
  updateStaff,
  type StaffActionResult,
  type StaffInput,
} from "./actions";

export type StaffRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

type FormMode = { type: "create" } | { type: "edit"; staff: StaffRow };

type Message = { kind: "error" | "success"; text: string };

const primaryButton =
  "cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton =
  "cursor-pointer rounded-lg border border-blush-border bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:bg-mist";
const dangerButton =
  "cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50";
const fieldClass =
  "rounded-xl border border-blush-border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-mist text-zinc-500"
      }`}
    >
      {isActive ? "Đang hoạt động" : "Đã tắt"}
    </span>
  );
}

function StaffForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: { name: string; isActive: boolean };
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: StaffInput) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [isActive, setIsActive] = useState(initial.isActive);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: name.trim(), isActive });
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
        Tên nhân viên
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Nguyễn Thị Lan"
          maxLength={100}
          autoFocus
          className={fieldClass}
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-blush-border accent-primary"
        />
        Đang hoạt động{" "}
        <span className="font-normal text-zinc-400">
          (hiển thị cho khách đặt lịch công khai)
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={submitting} className={ghostButton}>
          Hủy
        </button>
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? "Đang lưu…" : "Lưu nhân viên"}
        </button>
      </div>
    </form>
  );
}

export default function StaffManager({ staff }: { staff: StaffRow[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function run(
    id: string | null,
    action: () => Promise<StaffActionResult>,
    successText: string,
  ) {
    setPendingId(id);
    setMessage(null);
    try {
      const res = await action();
      if (res.ok) {
        setMode(null);
        setConfirmingDeleteId(null);
        setMessage({ kind: "success", text: successText });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    } catch {
      setMessage({ kind: "error", text: "Đã xảy ra lỗi, vui lòng thử lại." });
    } finally {
      setPendingId(null);
      setBusy(false);
    }
  }

  function onCreate(input: StaffInput) {
    setBusy(true);
    void run(null, () => createStaff(input), "Đã thêm nhân viên mới.");
  }

  function onEdit(id: string, input: StaffInput) {
    setBusy(true);
    void run(id, () => updateStaff(id, input), "Đã cập nhật nhân viên.");
  }

  function onToggle(s: StaffRow) {
    setBusy(true);
    void run(
      s.id,
      () => toggleStaffActive(s.id, !s.isActive),
      s.isActive
        ? `Đã tắt nhân viên "${s.name}" — không còn hiển thị cho khách đặt lịch.`
        : `Đã bật nhân viên "${s.name}".`,
    );
  }

  function onDelete(s: StaffRow) {
    setBusy(true);
    void run(s.id, () => deleteStaff(s.id), `Đã xóa nhân viên "${s.name}".`);
  }

  const formInitial =
    mode?.type === "edit"
      ? { name: mode.staff.name, isActive: mode.staff.isActive }
      : { name: "", isActive: true };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Nhân viên</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quản lý nhân viên của cơ sở. Tắt trạng thái để ẩn khỏi trang đặt lịch công khai.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode({ type: "create" });
            setMessage(null);
          }}
          disabled={busy}
          className={primaryButton}
        >
          Thêm nhân viên
        </button>
      </div>

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-xl px-3 py-2 text-sm ${
            message.kind === "error"
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {mode && (
        <div className="rounded-2xl border border-blush-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display mb-4 text-lg font-semibold text-zinc-900">
            {mode.type === "create" ? "Thêm nhân viên mới" : `Sửa nhân viên: ${mode.staff.name}`}
          </h2>
          <StaffForm
            key={mode.type === "edit" ? mode.staff.id : "create"}
            initial={formInitial}
            submitting={busy}
            onCancel={() => setMode(null)}
            onSubmit={mode.type === "create" ? onCreate : (input) => onEdit(mode.staff.id, input)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-blush-border bg-white shadow-md">
        {staff.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-600">
              Chưa có nhân viên nào. Bấm “Thêm nhân viên” để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-blush-border bg-mist/40 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Tên nhân viên</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const deleting = confirmingDeleteId === s.id;
                  const pending = pendingId === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-blush-border last:border-b-0 ${s.isActive ? "" : "bg-mist/30"}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-medium ${s.isActive ? "text-zinc-900" : "text-zinc-500"}`}>
                          {s.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ActiveBadge isActive={s.isActive} />
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {formatDateVn(s.createdAt.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href="/schedule"
                            className={ghostButton}
                            title="Thiết lập lịch làm việc theo tuần"
                          >
                            Lịch làm việc
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setMode({ type: "edit", staff: s });
                              setMessage(null);
                            }}
                            className={ghostButton}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onToggle(s)}
                            className={ghostButton}
                            title={
                              s.isActive
                                ? "Tắt — ẩn khỏi trang đặt lịch công khai"
                                : "Bật — hiển thị lại cho khách đặt lịch"
                            }
                          >
                            {pending && pendingId === s.id ? "Đang xử lý…" : s.isActive ? "Tắt" : "Bật"}
                          </button>
                          {deleting ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => onDelete(s)}
                                className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 disabled:opacity-50"
                              >
                                {pending ? "Đang xóa…" : "Chắc chắn xóa?"}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setConfirmingDeleteId(null)}
                                className={ghostButton}
                              >
                                Hủy
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setConfirmingDeleteId(s.id);
                                setMessage(null);
                              }}
                              className={dangerButton}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
