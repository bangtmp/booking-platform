import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await hashPassword("admin123");
  const ownerPassword = await hashPassword("owner123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@example.com",
      name: "Quản trị viên",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Salon Ánh Sao",
      businessType: "SALON",
      confirmMode: "AUTO",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: { role: "OWNER", tenantId: tenant.id },
    create: {
      email: "owner@demo.com",
      name: "Chủ tiệm",
      role: "OWNER",
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: admin.id },
    },
    update: { password: adminPassword },
    create: {
      providerId: "credential",
      accountId: admin.id,
      userId: admin.id,
      password: adminPassword,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: owner.id },
    },
    update: { password: ownerPassword },
    create: {
      providerId: "credential",
      accountId: owner.id,
      userId: owner.id,
      password: ownerPassword,
    },
  });

  // Demo STAFF account used to verify "bookings of mine" scoping (Task 9).
  const staffPassword = await hashPassword("staff123");
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@demo.com" },
    update: { role: "STAFF", tenantId: tenant.id },
    create: {
      email: "staff@demo.com",
      name: "Nhân viên test",
      role: "STAFF",
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: staffUser.id },
    },
    update: { password: staffPassword },
    create: {
      providerId: "credential",
      accountId: staffUser.id,
      userId: staffUser.id,
      password: staffPassword,
    },
  });

  await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.staff.deleteMany({ where: { tenantId: tenant.id } });

  await Promise.all(
    [
      { name: "Cắt tóc", price: 150000, durationMin: 30 },
      { name: "Nhuộm tóc", price: 350000, durationMin: 90 },
      { name: "Chăm sóc da mặt", price: 250000, durationMin: 45 },
    ].map((s) =>
      prisma.service.create({
        data: { ...s, tenantId: tenant.id },
      }),
    ),
  );

  const staff = await Promise.all(
    [
      { name: "Lan", userEmail: null },
      { name: "Hùng", userEmail: null },
      // Linked to the STAFF demo account above (staff@demo.com) so the staff
      // dashboard view has an "own bookings" scope to verify against.
      { name: "Test NV", userEmail: "staff@demo.com" },
    ].map((s) =>
      prisma.staff.create({
        data: { name: s.name, userEmail: s.userEmail, tenantId: tenant.id },
      }),
    ),
  );

  const schedules = [];
  for (const s of staff) {
    for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
      schedules.push(
        await prisma.schedule.create({
          data: {
            tenantId: tenant.id,
            staffId: s.id,
            dayOfWeek,
            startTime: "09:00",
            endTime: "18:00",
          },
        }),
      );
    }
  }

  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    tenants: await prisma.tenant.count(),
    services: await prisma.service.count(),
    staff: await prisma.staff.count(),
    schedules: await prisma.schedule.count(),
    bookings: await prisma.booking.count(),
  };
  console.log("Seed completed:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
