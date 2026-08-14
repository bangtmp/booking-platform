import { prisma } from "@/lib/prisma";
import {
  DEMO_TENANT,
  listServicesByTenant,
  listStaffsByTenant,
  listSchedulesByTenantStaff,
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
  },
  staff: {
    listByTenant: async (tenantId: string): Promise<DemoStaff[]> => {
      if (isDemo) return listStaffsByTenant(tenantId);
      const staffs = await prisma.staff.findMany({ where: { tenantId } });
      return staffs.map((staff) => ({ ...staff, userEmail: staff.userEmail ?? null }));
    },
  },
  schedule: {
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
    listByTenantDate: async (tenantId: string, date: string): Promise<DemoBooking[]> => {
      if (isDemo) return listBookingsByTenantDate(tenantId, date);
      const bookings = await prisma.booking.findMany({ where: { tenantId, date } });
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
