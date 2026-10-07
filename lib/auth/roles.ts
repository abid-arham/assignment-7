import type { Role } from "@/lib/api/types";

/** Where each role lands after signing in. Each prefix is owned by exactly one role. */
export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/dashboard",
  INSTRUCTOR: "/instructor",
  ADMIN: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin",
};

const isUnder = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** The role a dashboard path belongs to, or null for paths that are not role-scoped. */
export function roleForPath(pathname: string): Role | null {
  for (const [role, prefix] of Object.entries(ROLE_HOME) as [Role, string][]) {
    if (isUnder(pathname, prefix)) return role;
  }
  return null;
}

/**
 * Only same-site relative paths are honoured as post-login destinations (no "//evil.com" or absolute URLs),
 * and only when the signed-in role may open them.
 */
export function safeRedirect(next: string | null | undefined, role: Role): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return ROLE_HOME[role];
  const pathname = next.split(/[?#]/)[0] ?? next;
  const owner = roleForPath(pathname);
  if (owner && owner !== role) return ROLE_HOME[role];
  if (pathname === "/login" || pathname === "/register") return ROLE_HOME[role];
  return next;
}
