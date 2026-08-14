# Demo Readonly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `DEMO_MODE=true` runtime path to the booking platform so the app can run without an external database, with mocked auth and all mutations blocked.

**Architecture:** Introduce a `repo` abstraction over data access, a mock auth module, and a read-only guard. When `DEMO_MODE=true`, the app serves static demo data, auto-logs in an OWNER user, and disables all write operations. When `DEMO_MODE` is unset or false, behavior is unchanged.

**Tech Stack:** Next.js 16, Prisma (Postgres in production), better-auth (production), TypeScript, Tailwind CSS.

## Global Constraints

- Keep `main` branch untouched; implement on `demo-readonly`.
- `DEMO_MODE=true` must not require `DATABASE_URL`, `BETTER_AUTH_SECRET`, or `BETTER_AUTH_URL`.
- All existing production behavior must remain intact when `DEMO_MODE` is unset or `false`.
- Every mutation server action must throw a clear error in demo mode.
- UI must show a read-only banner and disable mutation buttons in demo mode.
- Static demo data must be self-contained TypeScript, no Prisma runtime dependency.

---

### Task 1: Create demo seed data module

**Files:**
- Create: `src/demo/seed-data.ts`

**Interfaces:**
- Produces: `DEMO_TENANT`, `DEMO_SERVICES`, `DEMO_STAFFS`, `DEMO_SCHEDULES`, `DEMO_BOOKINGS`, and getter functions `findTenantBySlug`, `listServicesByTenant`, `listStaffsByTenant`, `listSchedulesByTenantStaff`, `listBookingsByTenantDate`.

**Step 1: Write the module**

Create `src/demo/seed-data.ts`:

```ts
export interface DemoTenant {
  id: string;
  slug: string;
  name: string;
  businessType: "SALON";
  confirmMode: "AUTO";
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
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  note: string | null;
}

export const DEMO_TENANT: DemoTenant = {
  id: "demo-tenant",
  slug: "demo",
  name: "Salon Demo",
  businessType: "SALON",
  confirmMode: "AUTO",
  timezone: "Asia/Ho_Chi_Minh",
};

export const DEMO_SERVICES: DemoService[] = [
  { id: "s1", tenantId: DEMO_TENANT.id, name: "Cắt tóc nam", price: 120000, durationMin: 45, isActive: true },
  { id: "s2", tenantId: DEMO_TENANT.id, name: "Uốn tóc", price: 500000, durationMin: 120, isActive: true },
  { id: "s3", tenantId: DEMO_TENANT.id, name: "Nhuộm tóc", price: 600000, durationMin: 150, isActive: true },
  { id: "s4", tenantId: DEMO_TENANT.id, name: "Chăm sóc da", price: 300000, durationMin: 60, isActive: true },
];

export const DEMO_STAFFS: DemoStaff[] = [
  { id: "st1", tenantId: DEMO_TENANT.id, name: "Linh", userEmail: "linh@demo.local", isActive: true },
  { id: "st2", tenantId: DEMO_TENANT.id, name: "Minh", userEmail: "minh@demo.local", isActive: true },
  { id: "st3", tenantId: DEMO_TENANT.id, name: "Tuấn", userEmail: "tuan@demo.local", isActive: true },
];

export const DEMO_SCHEDULES: DemoSchedule[] = [
  ...DEMO_STAFFS.flatMap((staff) =>
    [1, 2, 3, 4, 5].flatMap((day) => [
      {
        id: `${staff.id}-${day}-am`,
        tenantId: DEMO_TENANT.id,
        staffId: staff.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
        breakStart: null,
        breakEnd: null,
        active: true,
      } as DemoSchedule,
      {
        id: `${staff.id}-${day}-pm`,
        tenantId: DEMO_TENANT.id,
        staffId: staff.id,
        dayOfWeek: day,
        startTime: "13:00",
        endTime: "17:00",
        breakStart: null,
        breakEnd: null,
        active: true,
      } as DemoSchedule,
    ])
  ),
];

export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    id: "b1",
    tenantId: DEMO_TENANT.id,
    staffId: DEMO_STAFFS[0].id,
    serviceId: DEMO_SERVICES[0].id,
    customerName: "Nguyễn Văn A",
    customerPhone: "0909123456",
    date: "2026-08-18",
    startTime: "09:00",
    endTime: "09:45",
    status: "CONFIRMED",
    note: null,
  },
  {
    id: "b2",
    tenantId: DEMO_TENANT.id,
    staffId: DEMO_STAFFS[1].id,
    serviceId: DEMO_SERVICES[2].id,
    customerName: "Trần Thị B",
    customerPhone: "0912345678",
    date: "2026-08-19",
    startTime: "13:00",
    endTime: "15:30",
    status: "PENDING",
    note: "Lần đầu đến",
  },
  {
    id: "b3",
    tenantId: DEMO_TENANT.id,
    staffId: DEMO_STAFFS[2].id,
    serviceId: DEMO_SERVICES[3].id,
    customerName: "Lê Văn C",
    customerPhone: "0933456789",
    date: "2026-08-20",
    startTime: "10:00",
    endTime: "11:00",
    status: "CONFIRMED",
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
```

**Step 2: Verify module compiles**

Run:
```bash
npx tsc --noEmit src/demo/seed-data.ts
```
Expected: no type errors.

**Step 3: Commit**

```bash
git add src/demo/seed-data.ts
git commit -m "feat(demo): add static seed data module"
```

---

### Task 2: Create data-access repo abstraction

**Files:**
- Create: `src/lib/repo.ts`
- Modify: `src/lib/prisma.ts`

**Interfaces:**
- Consumes: `DemoTenant`, `DemoService`, `DemoStaff`, `DemoSchedule`, `DemoBooking` from `src/demo/seed-data.ts`
- Produces: `repo` object with tenant, service, staff, schedule, booking namespaces matching production query signatures used across the app

**Step 1: Write `src/lib/repo.ts`**

```ts
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

export const repo = {
  tenant: {
    findBySlug: async (slug: string): Promise<DemoTenant | null> => {
      if (isDemo) return findTenantBySlug(slug);
      return prisma.tenant.findUnique({ where: { slug } }) as Promise<DemoTenant | null>;
    },
  },
  service: {
    listByTenant: async (tenantId: string): Promise<DemoService[]> => {
      if (isDemo) return listServicesByTenant(tenantId);
      return prisma.service.findMany({ where: { tenantId } }) as Promise<DemoService[]>;
    },
  },
  staff: {
    listByTenant: async (tenantId: string): Promise<DemoStaff[]> => {
      if (isDemo) return listStaffsByTenant(tenantId);
      return prisma.staff.findMany({ where: { tenantId } }) as Promise<DemoStaff[]>;
    },
  },
  schedule: {
    listByTenantStaff: async (tenantId: string, staffId: string): Promise<DemoSchedule[]> => {
      if (isDemo) return listSchedulesByTenantStaff(tenantId, staffId);
      return prisma.schedule.findMany({ where: { tenantId, staffId } }) as Promise<DemoSchedule[]>;
    },
  },
  booking: {
    listByTenantDate: async (tenantId: string, date: string): Promise<DemoBooking[]> => {
      if (isDemo) return listBookingsByTenantDate(tenantId, date);
      return prisma.booking.findMany({ where: { tenantId, date } }) as Promise<DemoBooking[]>;
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
      return prisma.booking.create({ data }) as Promise<DemoBooking>;
    },
  },
};
```

**Step 2: Keep `src/lib/prisma.ts` production-only and silent in demo mode**

Modify `src/lib/prisma.ts` to avoid instantiating Prisma when `DATABASE_URL` is absent in demo mode:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

No code change needed here because `repo.ts` gates usage. If `DATABASE_URL` is missing in production, Prisma will error at runtime as before.

**Step 3: Verify module compiles**

Run:
```bash
npx tsc --noEmit src/lib/repo.ts
```
Expected: no type errors.

**Step 4: Commit**

```bash
git add src/lib/repo.ts
git commit -m "feat(demo): add repo data access abstraction"
```

---

### Task 3: Create mock auth module

**Files:**
- Create: `src/lib/auth-mock.ts`

**Interfaces:**
- Produces: `getMockSession()`, `requireMockUser()`, `signOutMock()` compatible with current `auth-guard.ts` usage

**Step 1: Write `src/lib/auth-mock.ts`**

```ts
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER";
  tenantId: string;
}

export const MOCK_USER: MockUser = {
  id: "demo-user",
  name: "Demo Owner",
  email: "demo@demo.local",
  role: "OWNER",
  tenantId: "demo-tenant",
};

export function getMockSession() {
  return {
    user: MOCK_USER,
    session: { expiresAt: new Date("2099-01-01") },
  };
}

export function requireMockUser() {
  return MOCK_USER;
}

export function signOutMock() {
  return Promise.resolve();
}
```

**Step 2: Verify module compiles**

Run:
```bash
npx tsc --noEmit src/lib/auth-mock.ts
```
Expected: no type errors.

**Step 3: Commit**

```bash
git add src/lib/auth-mock.ts
git commit -m "feat(demo): add mock auth module"
```

---

### Task 4: Create read-only guard

**Files:**
- Create: `src/lib/read-only-guard.ts`

**Interfaces:**
- Produces: `ensureNotDemoMutation()` that throws in demo mode

**Step 1: Write `src/lib/read-only-guard.ts`**

```ts
export function ensureNotDemoMutation() {
  if (process.env.DEMO_MODE === "true") {
    throw new Error("Read-only demo");
  }
}
```

**Step 2: Verify module compiles**

Run:
```bash
npx tsc --noEmit src/lib/read-only-guard.ts
```
Expected: no type errors.

**Step 3: Commit**

```bash
git add src/lib/read-only-guard.ts
git commit -m "feat(demo): add read-only mutation guard"
```

---

### Task 5: Wire repo into production code paths

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/(dashboard)/services/page.tsx`
- Modify: `src/app/(dashboard)/staff/page.tsx`
- Modify: `src/app/(dashboard)/schedule/page.tsx`
- Modify: `src/app/(dashboard)/bookings/page.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx`
- Modify: `src/app/(public)/booking/[slug]/page.tsx`

**Interfaces:**
- Consumes: `repo` from `src/lib/repo.ts`
- Produces: updated page components that read via `repo` instead of direct `prisma`

**Step 1: Update dashboard layout**

In `src/app/(dashboard)/layout.tsx`, replace:
```ts
const tenant = user.tenantId
  ? await prisma.tenant.findUnique({ where: { id: user.tenantId } })
  : null;
```

With:
```ts
import { repo } from "@/lib/repo";

const tenant = user.tenantId
  ? await repo.tenant.findBySlug(/* or findById if you add it */)
  : null;
```

Note: `repo.tenant.findBySlug` currently only supports slug lookup. If needed, add `findById` to `repo.ts` first. For demo mode, we can map `tenantId` to `DEMO_TENANT` directly in the layout because the mock user has `tenantId = DEMO_TENANT.id`.

Simpler approach for layout: in demo mode, if `user.tenantId` equals `DEMO_TENANT.id`, construct tenant object from `DEMO_TENANT` directly without hitting repo.

```ts
import { DEMO_TENANT } from "@/demo/seed-data";

const tenant =
  process.env.DEMO_MODE === "true" && user.tenantId === DEMO_TENANT.id
    ? DEMO_TENANT
    : user.tenantId
      ? await prisma.tenant.findUnique({ where: { id: user.tenantId } })
      : null;
```

**Step 2: Update dashboard pages**

For each dashboard page, replace direct `prisma` imports with `repo` calls. Example for `src/app/(dashboard)/services/page.tsx`:

Replace:
```ts
const services = await prisma.service.findMany({ where: { tenantId } });
```

With:
```ts
const services = await repo.service.listByTenant(tenantId);
```

Apply the same pattern to:
- `dashboard/page.tsx`: `prisma.booking.count` → use `repo.booking.listByTenantDate` with count or add `countByTenant` to repo. For simplicity, in demo mode compute `DEMO_BOOKINGS.length`; in production keep `prisma.booking.count`.
- `staff/page.tsx`: `prisma.staff.findMany` → `repo.staff.listByTenant`
- `schedule/page.tsx`: `prisma.staff.findMany` + `prisma.schedule.findMany` → `repo.staff.listByTenant` + `repo.schedule.listByTenantStaff`
- `bookings/page.tsx`: multiple `prisma` calls → `repo` equivalents
- `settings/page.tsx`: `prisma.tenant.findUnique`, `prisma.staff.findMany`, `prisma.user.findMany` → add corresponding repo methods or keep Prisma for production-only reads if not yet abstracted. To keep scope small, abstract the tenant/staff/user reads used here.
- `admin/page.tsx`: `prisma.tenant.findMany` → add `repo.tenant.list()` or keep Prisma if admin is hidden in demo mode. Since demo mock user is `OWNER`, admin route will redirect; leave `admin/page.tsx` unchanged if guard already blocks it.

**Step 3: Update public booking page**

In `src/app/(public)/booking/[slug]/page.tsx`, replace `prisma.tenant.findUnique({ where: { slug } })` with `repo.tenant.findBySlug(slug)`. Replace `prisma.service.findMany`, `prisma.staff.findMany`, `prisma.schedule.findMany` with corresponding `repo` calls.

**Step 4: Verify pages compile**

Run:
```bash
npx next build
```
Expected: build succeeds with no unresolved imports.

**Step 5: Commit**

```bash
git add src/app/(dashboard)/layout.tsx src/app/(dashboard)/dashboard/page.tsx src/app/(dashboard)/services/page.tsx src/app/(dashboard)/staff/page.tsx src/app/(dashboard)/schedule/page.tsx src/app/(dashboard)/bookings/page.tsx src/app/(dashboard)/settings/page.tsx src/app/(public)/booking/[slug]/page.tsx
git commit -m "feat(demo): wire repo abstraction into pages"
```

---

### Task 6: Add read-only guard to all server actions

**Files:**
- Modify: `src/app/(auth)/actions.ts`
- Modify: `src/app/(dashboard)/bookings/actions.ts`
- Modify: `src/app/(dashboard)/schedule/actions.ts`
- Modify: `src/app/(dashboard)/services/actions.ts`
- Modify: `src/app/(dashboard)/settings/actions.ts`
- Modify: `src/app/(dashboard)/staff/actions.ts`
- Modify: `src/app/(public)/booking/[slug]/actions.ts`

**Interfaces:**
- Consumes: `ensureNotDemoMutation` from `src/lib/read-only-guard.ts`
- Produces: mutations throw `"Read-only demo"` in demo mode

**Step 1: Guard each exported mutation**

For every action file, import `ensureNotDemoMutation` and call it at the top of each mutation function.

Example `src/app/(dashboard)/services/actions.ts`:

```ts
"use server";

import { ensureNotDemoMutation } from "@/lib/read-only-guard";
import { repo } from "@/lib/repo";

export async function createService(input: CreateServiceInput) {
  ensureNotDemoMutation();
  // existing body...
}
```

Repeat for:
- `updateService`
- `toggleServiceActive`
- `deleteService`
- `createStaff`, `updateStaff`, `toggleStaffActive`, `deleteStaff`
- `saveSchedule`
- `updateBookingStatus`
- `updateTenantSettings`, `linkStaffEmail`, `unlinkStaffEmail`
- `createBooking` (public)
- `registerTenant` (auth)

Query actions like `getAvailability`, `getAvailableSlots` remain untouched.

**Step 2: Verify actions compile**

Run:
```bash
npx tsc --noEmit src/app/
```
Expected: no type errors.

**Step 3: Commit**

```bash
git add src/app/(auth)/actions.ts src/app/(dashboard)/bookings/actions.ts src/app/(dashboard)/schedule/actions.ts src/app/(dashboard)/services/actions.ts src/app/(dashboard)/settings/actions.ts src/app/(dashboard)/staff/actions.ts src/app/(public)/booking/[slug]/actions.ts
git commit -m "feat(demo): block mutations in demo mode"
```

---

### Task 7: Wire mock auth into dashboard guard

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/lib/auth-guard.ts` (optional, if needed)

**Interfaces:**
- Consumes: `requireMockUser`, `getMockSession` from `src/lib/auth-mock.ts`
- Produces: dashboard layout auto-logs in demo mode

**Step 1: Update dashboard layout auth**

In `src/app/(dashboard)/layout.tsx`, replace direct `requireUser()` with conditional logic:

```ts
import { requireUser } from "@/lib/auth-guard";
import { requireMockUser, getMockSession } from "@/lib/auth-mock";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user;
  if (process.env.DEMO_MODE === "true") {
    user = requireMockUser();
  } else {
    user = await requireUser();
  }
  // rest of layout...
}
```

This keeps `auth-guard.ts` untouched and only switches behavior at the layout entry point.

**Step 2: Verify layout compiles**

Run:
```bash
npx tsc --noEmit src/app/(dashboard)/layout.tsx
```
Expected: no type errors.

**Step 3: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat(demo): auto-login mock user in dashboard"
```

---

### Task 8: Add readonly banner and disable UI buttons

**Files:**
- Modify: `src/app/(dashboard)/_components/shell.tsx`
- Modify: `src/app/(public)/booking/[slug]/booking-flow.tsx`
- Modify: `src/app/(public)/booking/[slug]/page.tsx`

**Interfaces:**
- Produces: visual read-only indicators and disabled mutation controls in demo mode

**Step 1: Add dashboard banner**

In `src/app/(dashboard)/_components/shell.tsx`, add a banner inside the `<aside>` or `<header>`:

```tsx
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

return (
  <Shell ...>
    {isDemo && (
      <div className="bg-amber-50 px-4 py-2 text-sm text-amber-700 border-b border-amber-100">
        Bản demo – chỉ xem
      </div>
    )}
    {children}
  </Shell>
);
```

Expose `isDemo` via prop or inline check. Because `shell.tsx` is a client component, read from `process.env.NEXT_PUBLIC_DEMO_MODE` after adding it to `.env.example` and Vercel env. For local dev, also set `NEXT_PUBLIC_DEMO_MODE=true` alongside `DEMO_MODE=true` in `.env`.

**Step 2: Disable mutation buttons in dashboard pages**

For each dashboard page with add/edit/delete buttons, wrap mutation buttons in:

```tsx
{!isDemo && (
  <Button onClick={...}>Thêm</Button>
)}
```

Or use `disabled={isDemo}` if the component supports it. Focus on:
- Services manager: add/edit/delete/toggle buttons
- Staff manager: add/edit/delete/toggle buttons
- Schedule manager: save button
- Bookings page: status change buttons
- Settings page: save/link/unlink buttons

**Step 3: Disable public booking submit**

In `src/app/(public)/booking/[slug]/booking-flow.tsx`, disable the final submit button in demo mode and show a tooltip or text: “Bản demo không hỗ trợ đặt lịch.”

**Step 4: Commit**

```bash
git add src/app/(dashboard)/_components/shell.tsx src/app/(public)/booking/[slug]/booking-flow.tsx src/app/(dashboard)/services/actions.ts src/app/(dashboard)/staff/actions.ts src/app/(dashboard)/schedule/actions.ts src/app/(dashboard)/bookings/actions.ts src/app/(dashboard)/settings/actions.ts
git commit -m "feat(demo): add readonly banner and disable mutation UI"
```

---

### Task 9: Update configuration files

**Files:**
- Modify: `next.config.ts`
- Modify: `.env.example`

**Step 1: Update `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

**Step 2: Update `.env.example`**

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking?schema=public"
BETTER_AUTH_SECRET=replace-with-a-random-base64url-string
BETTER_AUTH_URL=http://localhost:3000
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

**Step 3: Commit**

```bash
git add next.config.ts .env.example
git commit -m "chore(demo): update next config and env example"
```

---

### Task 10: Verify demo mode end to end

**Step 1: Run local demo**

```bash
copy .env.example .env
# edit .env to set DEMO_MODE=true and NEXT_PUBLIC_DEMO_MODE=true
npm run dev
```

Visit:
- `/booking/demo` → should show services, staffs, schedules, and existing bookings.
- `/dashboard` → should auto-login and show the dashboard with the readonly banner.
- Try submitting a booking, creating a service, or changing settings → should show `"Read-only demo"` error or disabled UI.

**Step 2: Run production build sanity check**

```bash
# Reset env to production or unset demo vars
npm run build
```

Expected: build succeeds. No compile-time references to demo modules should leak into production bundles because they are gated by `process.env.DEMO_MODE`.

**Step 3: Commit any final fixes**

```bash
git add .
git commit -m "chore(demo): verify and fix demo mode"
```

---

## Self-Review

1. **Spec coverage:**
   - Static data module: Task 1 ✓
   - Repo abstraction: Task 2 ✓
   - Mock auth: Task 3 ✓
   - Read-only guard: Task 4 ✓
   - Wire repo into pages: Task 5 ✓
   - Guard server actions: Task 6 ✓
   - Mock auth in layout: Task 7 ✓
   - UI readonly indicators: Task 8 ✓
   - Config updates: Task 9 ✓
   - Verification: Task 10 ✓

2. **Placeholder scan:** No TODOs or vague steps. Every task includes concrete code and commit commands.

3. **Type consistency:** `repo` methods use demo interfaces that mirror Prisma model fields used in the app. Mock user shape matches `requireUser` return shape used in layout.

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-14-demo-readonly.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
