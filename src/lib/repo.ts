import { prisma } from "@/lib/prisma";
import {
  DEMO_TENANT,
  listServicesByTenant,
  listStaffsByTenant,
  listSchedulesByTenant,
  listSchedulesByTenantStaff,
  listBookingsByTenant,
  listBookingsByTenantDate,
  findTenantBySlug,
  type DemoTenant,
  type DemoService,
  type DemoStaff,
  type DemoSchedule,
  type DemoBooking,
} from "@/demo/seed-data";

const isDemo = process.env.DEMO_MODE === "true";

function toDemoService(service: { id: string; tenantId: string; name: string; price: unknown; durationMin: number; isActive: boolean }): DemoService {
  return {
    ...service,
    price: typeof service.price === "object" && service.price && typeof (service.price as { toNumber?: () => number }).toNumber === "function"
      ? (service.price as { toNumber: () => number }).toNumber()
      : Number(service.price),
  };
}

function toDemoBooking(booking: {
  id: string;
  tenantId: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  note?: string | null;
}): DemoBooking {
  return {
    ...booking,
    note: booking.note ?? null,
  };
}

export const repo = {
  tenant: {
    findById: async (id: string): Promise<DemoTenant | null> => {
      if (isDemo) return DEMO_TENANT.id === id ? DEMO_TENANT : null;
      const tenant = await prisma.tenant.findUnique({ where: { id } });
      return tenant ? ({ ...tenant, businessType: tenant.businessType, confirmMode: tenant.confirmMode } as DemoTenant) : null;
    },
    findBySlug: async (slug: string): Promise<DemoTenant | null> => {
      if (isDemo) return findTenantBySlug(slug);
      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      return tenant ? ({ ...tenant, businessType: tenant.businessType, confirmMode: tenant.confirmMode } as DemoTenant) : null;
    },
  },
  service: {
    listByTenant: async (tenantId: string): Promise<DemoService[]> => {
      if (isDemo) return listServicesByTenant(tenantId);
      const services = await prisma.service.findMany({ where: { tenantId } });
      return services.map(toDemoService);
    },
    findActive: async (tenantId: string, serviceId: string): Promise<DemoService | null> => {
      if (isDemo) return listServicesByTenant(tenantId).find((s) => s.id === serviceId && s.isActive) ?? null;
      const service = await prisma.service.findFirst({ where: { tenantId, id: serviceId, isActive: true } });
      return service ? toDemoService(service) : null;
    },
  },
  staff: {
    listByTenant: async (tenantId: string): Promise<DemoStaff[]> => {
      if (isDemo) return listStaffsByTenant(tenantId);
      const staffs = await prisma.staff.findMany({ where: { tenantId } });
      return staffs.map((staff) => ({ ...staff, userEmail: staff.userEmail ?? null }));
    },
    findActive: async (tenantId: string, staffId: string): Promise<DemoStaff | null> => {
      if (isDemo) return listStaffsByTenant(tenantId).find((s) => s.id === staffId && s.isActive) ?? null;
      const staff = await prisma.staff.findFirst({ where: { tenantId, id: staffId, isActive: true } });
      return staff ? ({ ...staff, userEmail: staff.userEmail ?? null } as DemoStaff) : null;
    },
  },
  schedule: {
    listByTenant: async (tenantId: string): Promise<DemoSchedule[]> => {
      if (isDemo) return listSchedulesByTenant(tenantId);
      const schedules = await prisma.schedule.findMany({ where: { tenantId } });
      return schedules.map((schedule) => ({
        ...schedule,
        breakStart: schedule.breakStart ?? null,
        breakEnd: schedule.breakEnd ?? null,
      }));
    },
    listByTenantStaff: async (tenantId: string, staffId: string): Promise<DemoSchedule[]> => {
      if (isDemo) return listSchedulesByTenantStaff(tenantId, staffId);
      const schedules = await prisma.schedule.findMany({ where: { tenantId, staffId } });
      return schedules.map((schedule) => ({
        ...schedule,
        breakStart: schedule.breakStart ?? null,
        breakEnd: schedule.breakEnd ?? null,
      }));
    },
  },
  booking: {
    listByTenant: async (tenantId: string): Promise<DemoBooking[]> => {
      if (isDemo) return listBookingsByTenant(tenantId);
      const bookings = await prisma.booking.findMany({ where: { tenantId } });
      return bookings.map(toDemoBooking);
    },
    listByTenantDate: async (tenantId: string, date: string): Promise<DemoBooking[]> => {
      if (isDemo) return listBookingsByTenantDate(tenantId, date);
      const bookings = await prisma.booking.findMany({ where: { tenantId, date } });
      return bookings.map(toDemoBooking);
    },
    listByTenantStaffDateRange: async (tenantId: string, staffId: string, start: string, end: string): Promise<DemoBooking[]> => {
      if (isDemo) return listBookingsByTenant(tenantId).filter((b) => b.staffId === staffId && b.date >= start && b.date <= end);
      const bookings = await prisma.booking.findMany({
        where: { tenantId, staffId, date: { gte: start, lte: end } },
      });
      return bookings.map(toDemoBooking);
    },
    create: async (data: {
      tenantId: string;
      staffId: string;
      serviceId: string;
      customerName: string;
      customerPhone: string;
      date: string;
      startTime: string;
      endTime: string;
      status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
      note?: string | null;
    }) => {
      if (isDemo) {
        throw new Error("Read-only demo");
      }
      const booking = await prisma.booking.create({ data });
      return toDemoBooking(booking);
    },
  },
};
