import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type UserRole = "ADMIN" | "OWNER" | "STAFF";
export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session["user"];

/** Role-aware dashboard home: what an unauthorized user is redirected to. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "OWNER":
      return "/dashboard";
    case "STAFF":
      return "/bookings";
  }
}

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
  if (!roles.includes(user.role as UserRole)) redirect(homeForRole(user.role as UserRole));
  return user;
}

export async function requireTenantOwner(): Promise<AuthUser> {
  const user = await requireRole("OWNER");
  if (!user.tenantId) redirect(homeForRole("OWNER"));
  return user;
}
