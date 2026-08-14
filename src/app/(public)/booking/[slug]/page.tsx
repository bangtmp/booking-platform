import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEMO_TENANT, DEMO_SCHEDULES } from "@/demo/seed-data";
import BookingFlow from "./booking-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
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
  const isDemo = process.env.DEMO_MODE === "true";
  const tenant = isDemo && slug === DEMO_TENANT.slug
    ? DEMO_TENANT
    : await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const tenantId = tenant.id;
  const [services, staffRows, staffSchedules] = await Promise.all([
    repo.service.listByTenant(tenantId),
    repo.staff.listByTenant(tenantId),
    repo.schedule.listByTenantStaff(tenantId, ""),
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
