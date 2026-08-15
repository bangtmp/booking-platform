import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { DEMO_TENANT } from "@/demo/seed-data";
import BookingFlow from "./booking-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await repo.tenant.findBySlug(slug);
  if (!tenant) return { title: "Đặt lịch" };
  return {
    title: `Đặt lịch — ${tenant.name}`,
    description: `Đặt lịch hẹn trực tuyến tại ${tenant.name}.`,
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await repo.tenant.findBySlug(slug);
  if (!tenant) notFound();

  const tenantId = tenant.id;
  const [services, staffRows, staffSchedules] = await Promise.all([
    repo.service.listByTenant(tenantId),
    repo.staff.listByTenant(tenantId),
    repo.schedule.listByTenant(tenantId),
  ]);

  const activeServices = services
    .filter((s) => s.isActive)
    .sort((a, b) => a.price - b.price);
  const activeStaff = staffRows
    .filter((s) => s.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Only show active staff who actually work: at least one active schedule row.
  const staffWithSchedule = new Set(staffSchedules.map((s) => s.staffId));
  const staff = activeStaff.filter((s) => staffWithSchedule.has(s.id));

  return (
    <BookingFlow
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        timezone: tenant.timezone,
        confirmMode: tenant.confirmMode,
      }}
      services={activeServices.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price.toString(),
        durationMin: s.durationMin,
      }))}
      staff={staff.map((s) => ({ id: s.id, name: s.name }))}
    />
  );
}
