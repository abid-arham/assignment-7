import {
  BarChart3Icon,
  BookOpenIcon,
  Building2Icon,
  CalendarRangeIcon,
  ClipboardListIcon,
  CreditCardIcon,
  HistoryIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ScrollTextIcon,
  UserCircleIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/api/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Each role sees only its own area — the same map drives the sidebar, breadcrumbs and page titles. */
export const NAV: Record<Role, NavGroup[]> = {
  STUDENT: [
    {
      label: "Academics",
      items: [
        { title: "Overview", href: "/dashboard", icon: LayoutDashboardIcon },
        { title: "Course registration", href: "/dashboard/register", icon: ClipboardListIcon },
        { title: "My enrollments", href: "/dashboard/enrollments", icon: BookOpenIcon },
        { title: "Transcript", href: "/dashboard/transcript", icon: ScrollTextIcon },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Tuition & payments", href: "/dashboard/payments", icon: CreditCardIcon },
        { title: "Profile", href: "/dashboard/profile", icon: UserCircleIcon },
      ],
    },
  ],
  INSTRUCTOR: [
    {
      label: "Teaching",
      items: [
        { title: "My sections", href: "/instructor", icon: LayersIcon },
        { title: "Grade analytics", href: "/instructor/analytics", icon: BarChart3Icon },
      ],
    },
    {
      label: "Account",
      items: [{ title: "Profile", href: "/instructor/profile", icon: UserCircleIcon }],
    },
  ],
  ADMIN: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon },
        { title: "Users", href: "/admin/users", icon: UsersIcon },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Courses", href: "/admin/courses", icon: LibraryIcon },
        { title: "Departments", href: "/admin/departments", icon: Building2Icon },
        { title: "Semesters", href: "/admin/semesters", icon: CalendarRangeIcon },
        { title: "Sections", href: "/admin/sections", icon: LayersIcon },
      ],
    },
    {
      label: "Oversight",
      items: [
        { title: "Audit log", href: "/admin/audit-logs", icon: HistoryIcon },
        { title: "Profile", href: "/admin/profile", icon: UserCircleIcon },
      ],
    },
  ],
};

/** The nav item a pathname belongs to (longest matching prefix). */
export function activeNavItem(role: Role, pathname: string): NavItem | undefined {
  return NAV[role]
    .flatMap((g) => g.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
