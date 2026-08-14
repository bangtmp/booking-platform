export interface DemoTenant {
  id: string;
  slug: string;
  name: string;
  businessType: 'SALON';
  confirmMode: 'AUTO';
  timezone: string;
}

export interface DemoService {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  durationMin: number;
  isActive: boolean;
}

export interface DemoStaff {
  id: string;
  tenantId: string;
  name: string;
  userEmail: string | null;
  isActive: boolean;
}

export interface DemoSchedule {
  id: string;
  tenantId: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  active: boolean;
}

export interface DemoBooking {
  id: string;
  tenantId: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  note: string | null;
}

export const DEMO_TENANT: DemoTenant = {
  id: 'demo-tenant',
  slug: 'demo',
  name: 'Salon Demo',
  businessType: 'SALON',
  confirmMode: 'AUTO',
  timezone: 'Asia/Ho_Chi_Minh',
};

export const DEMO_SERVICES: DemoService[] = [
  { id: 's1', tenantId: DEMO_TENANT.id, name: 'Cắt tóc nam', price: 120000, durationMin: 45, isActive: true },
  { id: 's2', tenantId: DEMO_TENANT.id, name: 'Uốn tóc', price: 500000, durationMin: 120, isActive: true },
  { id: 's3', tenantId: DEMO_TENANT.id, name: 'Nhuộm tóc', price: 600000, durationMin: 150, isActive: true },
  { id: 's4', tenantId: DEMO_TENANT.id, name: 'Chăm sóc da', price: 300000, durationMin: 60, isActive: true },
];

export const DEMO_STAFFS: DemoStaff[] = [
  { id: 'st1', tenantId: DEMO_TENANT.id, name: 'Linh', userEmail: 'linh@demo.local', isActive: true },
  { id: 'st2', tenantId: DEMO_TENANT.id, name: 'Minh', userEmail: 'minh@demo.local', isActive: true },
  { id: 'st3', tenantId: DEMO_TENANT.id, name: 'Tuấn', userEmail: 'tuan@demo.local', isActive: true },
];

export const DEMO_SCHEDULES: DemoSchedule[] = [
  ...DEMO_STAFFS.flatMap((staff) =>
    [1, 2, 3, 4, 5].flatMap((day) => [
      {
        id: `${staff.id}-${day}-am`,
        tenantId: DEMO_TENANT.id,
        staffId: staff.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '12:00',
        breakStart: null,
        breakEnd: null,
        active: true,
      } as DemoSchedule,
      {
        id: `${staff.id}-${day}-pm`,
        tenantId: DEMO_TENANT.id,
        staffId: staff.id,
        dayOfWeek: day,
        startTime: '13:00',
        endTime: '17:00',
        breakStart: null,
        breakEnd: null,
        active: true,
      } as DemoSchedule,
    ])
  ),
];

export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    id: 'b1',
    tenantId: DEMO_TENANT.id,
    staffId: DEMO_STAFFS[0].id,
    serviceId: DEMO_SERVICES[0].id,
    customerName: 'Nguyễn Văn A',
    customerPhone: '0909123456',
    date: '2026-08-18',
    startTime: '09:00',
    endTime: '09:45',
    status: 'CONFIRMED',
    note: null,
  },
  {
    id: 'b2',
    tenantId: DEMO_TENANT.id,
    staffId: DEMO_STAFFS[1].id,
    serviceId: DEMO_SERVICES[2].id,
    customerName: 'Trần Thị B',
    customerPhone: '0912345678',
    date: '2026-08-19',
    startTime: '13:00',
    endTime: '15:30',
    status: 'PENDING',
    note: 'Lần đầu đến',
  },
  {
    id: 'b3',
    tenantId: DEMO_TENANT.id,
    staffId: DEMO_STAFFS[2].id,
    serviceId: DEMO_SERVICES[3].id,
    customerName: 'Lê Văn C',
    customerPhone: '0933456789',
    date: '2026-08-20',
    startTime: '10:00',
    endTime: '11:00',
    status: 'CONFIRMED',
    note: null,
  },
];

export function findTenantBySlug(slug: string): DemoTenant | null {
  return DEMO_TENANT.slug === slug ? DEMO_TENANT : null;
}

export function listServicesByTenant(tenantId: string): DemoService[] {
  return DEMO_SERVICES.filter((s) => s.tenantId === tenantId);
}

export function listStaffsByTenant(tenantId: string): DemoStaff[] {
  return DEMO_STAFFS.filter((s) => s.tenantId === tenantId);
}

export function listSchedulesByTenantStaff(tenantId: string, staffId: string): DemoSchedule[] {
  return DEMO_SCHEDULES.filter((s) => s.tenantId === tenantId && s.staffId === staffId);
}

export function listBookingsByTenantDate(tenantId: string, date: string): DemoBooking[] {
  return DEMO_BOOKINGS.filter((b) => b.tenantId === tenantId && b.date === date);
}
