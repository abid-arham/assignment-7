import { requireRole } from "@/lib/api/server";

// proxy.ts already routes by role; this re-check keeps the area safe even if the matcher changes.
export default async function Layout({ children }: LayoutProps<"/dashboard">) {
  await requireRole("STUDENT");
  return children;
}
