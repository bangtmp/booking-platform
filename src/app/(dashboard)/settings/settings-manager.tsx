"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import {
  linkStaffEmail,
  unlinkStaffEmail,
  updateTenantSettings,
  type SettingsActionResult,
  type TenantSettingsInput,
} from "./actions";

export type SettingsTenant = {
  name: string;
  slug: string;
  businessType: "SALON" | "SPA" | "CLINIC" | "OTHER";
  timezone: string;
  confirmMode: "AUTO" | "MANUAL";
};

export type SettingsStaff = {
  id: string;
  name: string;
  isActive: boolean;
  userEmail: string | null;
  linkedUserName: string | null;
};

type Message = { kind: "error" | "success"; text: string };

const BUSINESS_TYPE_OPTIONS: { value: SettingsTenant["businessType"]; label: string }[] = [
  { value: "SALON", label: "Salon tóc" },
  { value: "SPA", label: "Spa & chăm sóc sức khỏe" },
  { value: "CLINIC", label: "Phòng khám" },
  { value: "OTHER", label: "Khác" },
];

const CONFIRM_MODE_OPTIONS: {
  value: SettingsTenant["confirmMode"];
  label: string;
  description: string;
}[] = [
  {
    value: "AUTO",
    label: "Tự động xác nhận",
    description: "Lịch hẹn được xác nhận ngay khi khách đặt lịch.",
  },
  {
    value: "MANUAL",
    label: "Xác nhận thủ công",
    description: "Lịch hẹn mới ở trạng thái chờ, bạn duyệt trên trang Lịch hẹn.",
  },
];

const primaryButton =
  "cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton =
  "cursor-pointer rounded-lg border border-blush-border bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50";
const dangerButton =
  "cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass =
  "rounded-xl border border-blush-border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

function MessageBanner({ message }: { message: Message | null }) {
  if (!message) return null;
  return (
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
  );
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-blush-border bg-white p-5 shadow-md sm:p-6">
      <h2 className="font-display text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BasicsForm({
  initial,
  submitting,
  onSubmit,
}: {
  initial: SettingsTenant;
  submitting: boolean;
  onSubmit: (input: TenantSettingsInput) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [businessType, setBusinessType] = useState(initial.businessType);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [confirmMode, setConfirmMode] = useState(initial.confirmMode);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: name.trim(), businessType, timezone, confirmMode });
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Tên cơ sở
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Salon Ánh Sao"
            maxLength={100}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Loại hình kinh doanh
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value as SettingsTenant["businessType"])}
            className={fieldClass}
          >
            {BUSINESS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Múi giờ
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={fieldClass}
          >
            {TIMEZONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Đường dẫn đặt lịch công khai
          <div className="flex h-[42px] items-center rounded-xl border border-blush-border bg-mist/50 px-3 text-sm text-zinc-500">
            /booking/{initial.slug}
          </div>
          <p className="text-xs font-normal text-zinc-400">
            Không thể thay đổi — đường dẫn này được dùng cho khách đặt lịch.
          </p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700">Chế độ xác nhận đặt lịch</legend>
        {CONFIRM_MODE_OPTIONS.map((o) => (
          <label
            key={o.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 ${
              confirmMode === o.value
                ? "border-primary bg-primary/5"
                : "border-blush-border bg-white hover:bg-mist"
            }`}
          >
            <input
              type="radio"
              name="confirmMode"
              value={o.value}
              checked={confirmMode === o.value}
              onChange={(e) => setConfirmMode(e.target.value as SettingsTenant["confirmMode"])}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900">{o.label}</span>
              <span className="block text-xs text-zinc-500">{o.description}</span>
            </span>
          </label>
        ))}
        <p className="text-xs text-zinc-400">
          Chỉ áp dụng cho lịch hẹn mới; các lịch hẹn đang chờ giữ nguyên trạng thái.
        </p>
      </fieldset>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting || readonly} className={primaryButton}>
          {submitting ? "Đang lưu…" : "Lưu cài đặt"}
        </button>
      </div>
    </form>
  );
}

function StaffLinkRow({
  staff,
  busy,
  linkingId,
  linkEmail,
  onLinkEmailChange,
  onStartLink,
  onCancelLink,
  onSubmitLink,
  confirmingUnlinkId,
  onAskUnlink,
  onCancelUnlink,
  onConfirmUnlink,
}: {
  staff: SettingsStaff;
  busy: boolean;
  linkingId: string | null;
  linkEmail: string;
  onLinkEmailChange: (email: string) => void;
  onStartLink: (id: string) => void;
  onCancelLink: () => void;
  onSubmitLink: (id: string) => void;
  confirmingUnlinkId: string | null;
  onAskUnlink: (id: string) => void;
  onCancelUnlink: () => void;
  onConfirmUnlink: (id: string) => void;
}) {
  const linking = linkingId === staff.id;
  const confirmingUnlink = confirmingUnlinkId === staff.id;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blush-border px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900">
          {staff.name}
          {!staff.isActive && (
            <span className="ml-2 rounded bg-mist px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
              Đã tắt
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {staff.userEmail ? (
            <>
              Đã liên kết:{" "}
              <span className="font-medium text-zinc-700">{staff.userEmail}</span>
              {staff.linkedUserName ? (
                <> · {staff.linkedUserName}</>
              ) : (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  không tìm thấy tài khoản tương ứng
                </span>
              )}
            </>
          ) : (
            <span className="text-zinc-400">Chưa liên kết tài khoản</span>
          )}
        </p>
      </div>

      {linking ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitLink(staff.id);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            autoFocus
            type="email"
            required
            value={linkEmail}
            onChange={(e) => onLinkEmailChange(e.target.value)}
            placeholder="email-nhan-vien@..."
            className={`${fieldClass} w-64`}
          />
          <button type="submit" disabled={busy || readonly} className={primaryButton}>
            {busy ? "Đang lưu…" : "Liên kết"}
          </button>
          <button type="button" disabled={busy || readonly} onClick={onCancelLink} className={ghostButton}>
            Hủy
          </button>
        </form>
      ) : confirmingUnlink ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Bỏ liên kết?</span>
          <button
            type="button"
            disabled={busy || readonly}
            onClick={() => onConfirmUnlink(staff.id)}
            className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : "Chắc chắn bỏ"}
          </button>
          <button type="button" disabled={busy || readonly} onClick={onCancelUnlink} className={ghostButton}>
            Hủy
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {!staff.userEmail && (
            <button type="button" disabled={busy || readonly} onClick={() => onStartLink(staff.id)} className={ghostButton}>
              Liên kết
            </button>
          )}
          {staff.userEmail && (
            <button type="button" disabled={busy || readonly} onClick={() => onAskUnlink(staff.id)} className={dangerButton}>
              Bỏ liên kết
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsManager({
  isDemo,
  tenant,
  staffs,
}: {
  isDemo?: boolean;
  tenant: SettingsTenant;
  staffs: SettingsStaff[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [saving, setSaving] = useState(false);
  const readonly = isDemo === true;
  const [busy, setBusy] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [confirmingUnlinkId, setConfirmingUnlinkId] = useState<string | null>(null);

  async function run(
    id: string | null,
    action: () => Promise<SettingsActionResult>,
    successText: string,
    onDone?: () => void,
  ) {
    setMessage(null);
    try {
      const res = await action();
      if (res.ok) {
        setMessage({ kind: "success", text: successText });
        onDone?.();
        router.refresh();
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    } catch {
      setMessage({ kind: "error", text: "Đã xảy ra lỗi, vui lòng thử lại." });
    } finally {
      setBusy(false);
      setSaving(false);
    }
  }

  function onSave(input: TenantSettingsInput) {
    setSaving(true);
    void run(null, () => updateTenantSettings(input), "Đã lưu cài đặt cơ sở.");
  }

  function onSubmitLink(id: string) {
    setBusy(true);
    void run(
      id,
      () => linkStaffEmail({ staffId: id, email: linkEmail }),
      "Đã liên kết tài khoản nhân viên.",
      () => {
        setLinkingId(null);
        setLinkEmail("");
      },
    );
  }

  function onConfirmUnlink(id: string) {
    setBusy(true);
    void run(
      id,
      () => unlinkStaffEmail(id),
      "Đã bỏ liên kết tài khoản nhân viên.",
      () => setConfirmingUnlinkId(null),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Cài đặt</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Quản lý thông tin cơ sở và liên kết tài khoản nhân viên.
        </p>
      </div>

      <MessageBanner message={message} />

      <Card
        title="Thông tin cơ sở"
        description="Tên, loại hình kinh doanh, múi giờ và chế độ xác nhận đặt lịch."
      >
        <BasicsForm key={tenant.slug} initial={tenant} submitting={saving} onSubmit={onSave} />
      </Card>

      <Card
        title="Liên kết tài khoản nhân viên"
        description="Gắn tài khoản nhân viên (đã đăng ký) với hồ sơ nhân viên để họ xem lịch hẹn của mình trên trang Lịch hẹn."
      >
        {staffs.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có nhân viên nào trong cơ sở.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-blush-border bg-white">
            {staffs.map((s) => (
              <StaffLinkRow
                key={s.id}
                staff={s}
                busy={busy}
                linkingId={linkingId}
                linkEmail={linkEmail}
                onLinkEmailChange={setLinkEmail}
                onStartLink={(id) => {
                  setLinkingId(id);
                  setLinkEmail("");
                  setConfirmingUnlinkId(null);
                }}
                onCancelLink={() => {
                  setLinkingId(null);
                  setLinkEmail("");
                }}
                onSubmitLink={onSubmitLink}
                confirmingUnlinkId={confirmingUnlinkId}
                onAskUnlink={(id) => {
                  setConfirmingUnlinkId(id);
                  setLinkingId(null);
                }}
                onCancelUnlink={() => setConfirmingUnlinkId(null)}
                onConfirmUnlink={onConfirmUnlink}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
