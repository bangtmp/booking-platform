import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type UserRole = "ADMIN" | "OWNER" | "STAFF";
export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session["user"];

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role as UserRole)) redirect("/");
  return user;
}

export async function requireTenantOwner(): Promise<AuthUser> {
  const user = await requireRole("OWNER");
  if (!user.tenantId) redirect("/");
  return user;
}
