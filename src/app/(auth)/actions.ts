"use server";

import { hashPassword } from "better-auth/crypto";
import { Prisma, $Enums } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type RegisterTenantInput = {
  tenantName: string;
  businessType: string;
  email: string;
  password: string;
  displayName: string;
};

export type RegisterTenantResult =
  | { ok: true; tenantSlug: string }
  | { ok: false; error: string };

const BUSINESS_TYPES = ["SALON", "SPA", "CLINIC", "OTHER"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`slug taken: ${slug}`);
    this.name = "SlugTakenError";
  }
}

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "tenant";
}

function validate(input: RegisterTenantInput): string | null {
  if (!input.tenantName?.trim()) return "Tên cơ sở là bắt buộc.";
  if (!BUSINESS_TYPES.includes(input.businessType as (typeof BUSINESS_TYPES)[number]))
    return "Loại hình kinh doanh không hợp lệ.";
  if (!EMAIL_RE.test(input.email?.trim())) return "Email không hợp lệ.";
  if (!input.password || input.password.length < 8)
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (!input.displayName?.trim()) return "Tên hiển thị là bắt buộc.";
  return null;
}

export async function registerTenant(
  raw: RegisterTenantInput,
): Promise<RegisterTenantResult> {
  const invalid = validate(raw);
  if (invalid) return { ok: false, error: invalid };

  const email = raw.email.trim().toLowerCase();
  const name = raw.displayName.trim();
  const tenantName = raw.tenantName.trim();
  const businessType = raw.businessType as $Enums.TenantBusinessType;
  const baseSlug = slugify(tenantName);

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    try {
      const tenant = await prisma.$transaction(async (tx) => {
        const taken = await tx.tenant.findUnique({ where: { slug } });
        if (taken) throw new SlugTakenError(slug);

        const t = await tx.tenant.create({
          data: { slug, name: tenantName, businessType },
        });
        const u = await tx.user.create({
          data: {
            email,
            name,
            role: "OWNER",
            tenantId: t.id,
            emailVerified: true,
          },
        });
        await tx.account.create({
          data: {
            userId: u.id,
            accountId: u.id,
            providerId: "credential",
            password: await hashPassword(raw.password),
          },
        });
        return t;
      });
      return { ok: true, tenantSlug: tenant.slug };
    } catch (e) {
      if (e instanceof SlugTakenError) continue;
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const target = e.meta?.target as string[] | undefined;
        if (target?.includes("slug")) continue;
        return { ok: false, error: "Đã xảy ra lỗi, vui lòng thử lại." };
      }
      console.error("registerTenant error", e);
      return { ok: false, error: "Đã xảy ra lỗi, vui lòng thử lại." };
    }
  }

  return { ok: false, error: "Không tạo được đường dẫn (slug) cho cơ sở." };
}
