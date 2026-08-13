import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const [services, staffRows, staffSchedules] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { price: "asc" },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.schedule.findMany({
      where: { tenantId: tenant.id, active: true },
      select: { staffId: true },
    }),
  ]);

  // Only show active staff who actually work: at least one active schedule row.
  const staffWithSchedule = new Set(staffSchedules.map((s) => s.staffId));
  const staff = staffRows.filter((s) => staffWithSchedule.has(s.id));

  return (
    <BookingFlow
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        timezone: tenant.timezone,
        confirmMode: tenant.confirmMode,
      }}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price.toString(),
        durationMin: s.durationMin,
      }))}
      staff={staff.map((s) => ({ id: s.id, name: s.name }))}
    />
  );
}
