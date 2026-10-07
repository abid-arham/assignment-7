import "server-only";

import type { Role } from "@/lib/api/types";

/**
 * Credentials behind the one-click demo buttons. They stay on the server: the browser only sends the
 * role it wants, so the password is never shipped in client JavaScript. Defaults match the API seed.
 */
export const DEMO_ACCOUNTS: Record<Role, { email: string; password: string }> = {
  ADMIN: {
    email: process.env.DEMO_ADMIN_EMAIL ?? "admin@ums.demo",
    password: process.env.DEMO_ADMIN_PASSWORD ?? "Passw0rd!",
  },
  STUDENT: {
    email: process.env.DEMO_STUDENT_EMAIL ?? "student1@ums.demo",
    password: process.env.DEMO_STUDENT_PASSWORD ?? "Passw0rd!",
  },
  INSTRUCTOR: {
    email: process.env.DEMO_INSTRUCTOR_EMAIL ?? "instructor1@ums.demo",
    password: process.env.DEMO_INSTRUCTOR_PASSWORD ?? "Passw0rd!",
  },
};
