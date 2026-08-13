"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  formatDateChipVn,
  formatDateVn,
  formatPriceVn,
  formatTimeRangeVn,
  tenantNow,
} from "@/lib/datetime";
import {
  createBooking,
  getAvailability,
  getAvailableSlots,
  type BookingSummary,
} from "./actions";
import { addMinutes } from "@/lib/availability";

type ServiceOption = { id: string; name: string; price: string; durationMin: number };
type StaffOption = { id: string; name: string };
type TenantOption = { slug: string; name: string; timezone: string; confirmMode: "AUTO" | "MANUAL" };

const STEP_LABELS = ["Dịch vụ", "Thời gian", "Thông tin"];

const buttonBase =
  "cursor-pointer rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const primaryButton = `${buttonBase} bg-primary-deep px-6 py-3 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50`;
const ghostButton = `${buttonBase} border border-blush-border bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-mist`;

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
        {step}
      </span>
      <h2 className="font-display text-lg font-semibold text-zinc-900">{title}</h2>
    </div>
  );
}

export default function BookingFlow({
  tenant,
  services,
  staff,
}: {
  tenant: TenantOption;
  services: ServiceOption[];
  staff: StaffOption[];
}) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceOption | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [availDays, setAvailDays] = useState<Record<string, string[]> | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<string[] | null>(null);
  const [success, setSuccess] = useState<BookingSummary | null>(null);

  const dateList = useMemo(() => {
    const start = tenantNow(tenant.timezone).date;
    return Array.from({ length: 14 }, (_, i) => addDays(start, i));
  }, [tenant.timezone]);

  const selectedStaff = staff.find((s) => s.id === staffId) ?? null;

  function selectService(s: ServiceOption) {
    if (service && service.id !== s.id) {
      setStaffId(null);
      setAvailDays(null);
      setAvailError(null);
      setSelectedDate(null);
      setSlots(null);
      setSlotsError(null);
      setSelectedSlot(null);
    }
    setService(s);
    setStep(2);
  }

  async function selectStaff(id: string) {
    if (!service || id === staffId) return;
    setStaffId(id);
    setSelectedDate(null);
    setSlots(null);
    setSlotsError(null);
    setSelectedSlot(null);
    setAvailDays(null);
    setAvailError(null);
    setAvailLoading(true);
    const res = await getAvailability(tenant.slug, id, service.id);
    setAvailLoading(false);
    if (res.ok) {
      const map: Record<string, string[]> = {};
      for (const d of res.days) map[d.date] = d.slots;
      setAvailDays(map);
    } else {
      setAvailError(res.error);
    }
  }

  async function selectDate(date: string) {
    if (!service || !staffId || date === selectedDate) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots(null);
    setSlotsError(null);
    setSlotsLoading(true);
    const res = await getAvailableSlots(tenant.slug, staffId, date, service.id);
    setSlotsLoading(false);
    if (res.ok) {
      setSlots(res.slots);
      if (res.slots.length === 0) setSlotsError("Ngày này đã hết chỗ trống, vui lòng chọn ngày khác.");
    } else {
      setSlots([]);
      setSlotsError(res.error);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !staffId || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    setSuggestedSlots(null);
    const res = await createBooking({
      tenantSlug: tenant.slug,
      staffId,
      serviceId: service.id,
      date: selectedDate,
      startTime: selectedSlot,
      customerName: name,
      customerPhone: phone,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(res.booking);
    } else {
      setSubmitError(res.error);
      if (res.suggestedSlots?.length) setSuggestedSlots(res.suggestedSlots);
    }
  }

  function resetAll() {
    setStep(1);
    setService(null);
    setStaffId(null);
    setAvailDays(null);
    setAvailError(null);
    setSelectedDate(null);
    setSlots(null);
    setSlotsError(null);
    setSelectedSlot(null);
    setSubmitError(null);
    setSuggestedSlots(null);
    setSuccess(null);
  }

  const fieldClass =
    "rounded-xl border border-blush-border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (success) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-blush-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h1 className="font-display mt-4 text-2xl font-bold text-zinc-900">
            Đặt lịch thành công!
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cảm ơn {success.customerName}. Thông tin đặt lịch của bạn:
          </p>
          <div className="mt-6 rounded-2xl bg-mist p-5 text-left text-sm">
            <div className="flex items-center justify-between border-b border-blush-border pb-3">
              <span className="text-zinc-500">Mã đặt lịch</span>
              <span className="font-mono font-bold text-primary-deep">{success.reference}</span>
            </div>
            <SummaryRow label="Dịch vụ" value={success.serviceName} />
            <SummaryRow label="Nhân viên" value={success.staffName} />
            <SummaryRow label="Thời gian" value={`${formatDateVn(success.date)}, ${formatTimeRangeVn(success.startTime, success.endTime)}`} />
            <SummaryRow
              label="Trạng thái"
              value={
                success.status === "CONFIRMED"
                  ? "Đã xác nhận"
                  : "Chờ xác nhận từ cơ sở"
              }
            />
          </div>
          {success.status === "PENDING" && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Lịch hẹn đang chờ cơ sở xác nhận. Vui lòng chờ nhân viên liên hệ.
            </p>
          )}
          <button onClick={resetAll} className={`${ghostButton} mt-6`}>
            Đặt thêm lịch khác
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Đặt lịch trực tuyến
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
          {tenant.name}
        </h1>
      </header>

      <nav aria-label="Các bước đặt lịch" className="mt-8 flex items-center justify-center gap-2 sm:gap-4">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-primary text-white"
                      : active
                        ? "bg-primary-deep text-white"
                        : "bg-mist text-zinc-500"
                  }`}
                >
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : n}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    active ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {n < STEP_LABELS.length && <span className="h-px w-6 bg-blush-border sm:w-10" />}
            </div>
          );
        })}
      </nav>

      <div className="mt-8 rounded-3xl border border-blush-border bg-white p-5 shadow-sm sm:p-8">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <SectionTitle step="1" title="Chọn dịch vụ" />
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s)}
                  className={`${buttonBase} flex items-center justify-between gap-3 border px-4 py-4 text-left hover:border-primary hover:bg-blush ${
                    service?.id === s.id ? "border-primary bg-blush" : "border-blush-border bg-white"
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-zinc-900">{s.name}</span>
                    <span className="mt-0.5 block text-sm text-zinc-500">{s.durationMin} phút</span>
                  </span>
                  <span className="shrink-0 font-bold text-primary-deep">
                    {formatPriceVn(s.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && service && (
          <div className="flex flex-col gap-7">
            <div className="flex items-center justify-between">
              <SectionTitle step="2" title="Chọn nhân viên và thời gian" />
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`${ghostButton} px-3 py-1.5 text-xs`}
              >
                ← Quay lại
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-zinc-700">Chọn nhân viên</p>
              <div className="flex flex-wrap gap-2">
                {staff.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => selectStaff(st.id)}
                    className={`${buttonBase} px-4 py-2 text-sm font-medium ${
                      staffId === st.id
                        ? "bg-primary-deep text-white"
                        : "border border-blush-border bg-white text-zinc-700 hover:border-primary hover:text-primary-deep"
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>

            {availLoading && (
              <Spinner label="Đang kiểm tra lịch trống…" />
            )}
            {!availLoading && availError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{availError}</p>
            )}
            {!availLoading && !availError && staffId && !availDays && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Nhân viên này hiện không có lịch trống trong 14 ngày tới.
              </p>
            )}

            {!availLoading && availDays && (
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">Chọn ngày</p>
                <div className="flex flex-wrap gap-2">
                  {dateList.map((date) => {
                    const free = (availDays[date]?.length ?? 0) > 0;
                    const selected = selectedDate === date;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={!free}
                        onClick={() => selectDate(date)}
                        aria-pressed={selected}
                        title={free ? formatDateVn(date) : "Không có lịch trong ngày này"}
                        className={`${buttonBase} min-w-[4.5rem] px-3 py-2 text-center text-sm font-medium ${
                          selected
                            ? "bg-primary-deep text-white"
                            : free
                              ? "border border-blush-border bg-white text-zinc-700 hover:border-primary hover:text-primary-deep"
                              : "cursor-not-allowed border border-blush-border bg-mist/60 text-zinc-400"
                        }`}
                      >
                        {formatDateChipVn(date)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!availLoading && selectedDate && (
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">
                  Chọn khung giờ · {formatDateVn(selectedDate)}
                </p>
                {slotsLoading && <Spinner label="Đang tải khung giờ…" />}
                {!slotsLoading && slotsError && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{slotsError}</p>
                )}
                {!slotsLoading && !slotsError && slots && slots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const selected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setStep(3);
                          }}
                          aria-pressed={selected}
                          className={`${buttonBase} border px-3 py-2 text-center font-mono text-sm ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-blush-border bg-white text-zinc-700 hover:border-primary hover:text-primary-deep"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && service && staffId && selectedDate && selectedSlot && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <SectionTitle step="3" title="Thông tin khách hàng" />
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`${ghostButton} px-3 py-1.5 text-xs`}
              >
                ← Quay lại
              </button>
            </div>

            <div className="rounded-2xl bg-mist p-4 text-sm">
              <p className="font-semibold text-zinc-900">{service.name}</p>
              <p className="mt-0.5 text-zinc-600">
                {selectedStaff?.name} · {formatDateVn(selectedDate)} ·{" "}
                {formatTimeRangeVn(selectedSlot, addMinutes(selectedSlot, service.durationMin))}
              </p>
              <p className="mt-1 font-bold text-primary-deep">
                {formatPriceVn(service.price)}
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Họ và tên
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  autoComplete="name"
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Số điện thoại
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0901234567"
                  autoComplete="tel"
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Ghi chú{" "}
                <span className="font-normal text-zinc-400">(không bắt buộc)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Tôi bị dị ứng hóa chất, nhờ tư vấn trước khi nhuộm."
                  rows={3}
                  maxLength={500}
                  className={`${fieldClass} resize-none`}
                />
              </label>

              {submitError && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  <p>{submitError}</p>
                  {suggestedSlots && suggestedSlots.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-red-700">Khung giờ còn trống khác:</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {suggestedSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSubmitError(null);
                              setSuggestedSlots(null);
                            }}
                            className={`${buttonBase} border border-red-200 bg-white px-2.5 py-1 font-mono text-xs text-red-700 hover:border-red-400`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${primaryButton} mt-1 self-end`}
              >
                {submitting ? "Đang xử lý…" : "Xác nhận đặt lịch"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-blush-border py-2.5 last:border-b-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-900">{value}</span>
    </div>
  );
}
