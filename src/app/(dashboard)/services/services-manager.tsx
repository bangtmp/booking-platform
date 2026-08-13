"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateVn, formatPriceVn } from "@/lib/datetime";
import {
  createService,
  deleteService,
  toggleServiceActive,
  updateService,
  type ServiceActionResult,
  type ServiceInput,
} from "./actions";

export type ServiceRow = {
  id: string;
  name: string;
  durationMin: number;
  price: string;
  isActive: boolean;
  createdAt: string;
};

type FormMode = { type: "create" } | { type: "edit"; service: ServiceRow };

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

function ServiceForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: { name: string; durationMin: string; price: string; isActive: boolean };
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: ServiceInput) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [durationMin, setDurationMin] = useState(initial.durationMin);
  const [price, setPrice] = useState(initial.price);
  const [isActive, setIsActive] = useState(initial.isActive);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name.trim(),
          durationMin: Number(durationMin),
          price: Number(price),
          isActive,
        });
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
        Tên dịch vụ
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Gội đầu dưỡng sinh"
          maxLength={100}
          autoFocus
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Thời lượng (phút)
          <input
            required
            type="number"
            min={1}
            max={1440}
            step={1}
            inputMode="numeric"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder="VD: 60"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Giá (VNĐ)
          <input
            required
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="VD: 150000"
            className={fieldClass}
          />
        </label>
      </div>

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
          {submitting ? "Đang lưu…" : "Lưu dịch vụ"}
        </button>
      </div>
    </form>
  );
}

export default function ServicesManager({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function run(
    id: string | null,
    action: () => Promise<ServiceActionResult>,
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

  function onCreate(input: ServiceInput) {
    setBusy(true);
    void run(null, () => createService(input), "Đã thêm dịch vụ mới.");
  }

  function onEdit(id: string, input: ServiceInput) {
    setBusy(true);
    void run(id, () => updateService(id, input), "Đã cập nhật dịch vụ.");
  }

  function onToggle(s: ServiceRow) {
    setBusy(true);
    void run(
      s.id,
      () => toggleServiceActive(s.id, !s.isActive),
      s.isActive
        ? `Đã tắt dịch vụ "${s.name}" — không còn hiển thị cho khách đặt lịch.`
        : `Đã bật dịch vụ "${s.name}".`,
    );
  }

  function onDelete(s: ServiceRow) {
    setBusy(true);
    void run(s.id, () => deleteService(s.id), `Đã xóa dịch vụ "${s.name}".`);
  }

  const formInitial =
    mode?.type === "edit"
      ? {
          name: mode.service.name,
          durationMin: String(mode.service.durationMin),
          price: mode.service.price,
          isActive: mode.service.isActive,
        }
      : { name: "", durationMin: "", price: "", isActive: true };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Dịch vụ</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quản lý danh sách dịch vụ hiển thị trên trang đặt lịch công khai.
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
          Thêm dịch vụ
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
            {mode.type === "create" ? "Thêm dịch vụ mới" : `Sửa dịch vụ: ${mode.service.name}`}
          </h2>
          <ServiceForm
            key={mode.type === "edit" ? mode.service.id : "create"}
            initial={formInitial}
            submitting={busy}
            onCancel={() => setMode(null)}
            onSubmit={mode.type === "create" ? onCreate : (input) => onEdit(mode.service.id, input)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-blush-border bg-white shadow-sm">
        {services.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-600">
              Chưa có dịch vụ nào. Bấm “Thêm dịch vụ” để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-blush-border bg-mist/40 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Tên dịch vụ</th>
                  <th className="px-4 py-3 font-semibold">Thời lượng</th>
                  <th className="px-4 py-3 font-semibold">Giá</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
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
                      <td className="px-4 py-3 text-zinc-600">{s.durationMin} phút</td>
                      <td className="px-4 py-3 font-semibold text-primary-deep">
                        {formatPriceVn(s.price)}
                      </td>
                      <td className="px-4 py-3">
                        <ActiveBadge isActive={s.isActive} />
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {formatDateVn(s.createdAt.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setMode({ type: "edit", service: s });
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
