"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/dashboard/auth-provider";
import { activeNavItem } from "@/components/dashboard/nav-config";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/auth/roles";

export function DashboardHeader() {
  const { role } = useAuth();
  const pathname = usePathname();
  const item = activeNavItem(role, pathname);
  const home = ROLE_HOME[role];
  // Deeper pages (a course, a section roster) get a "Details" crumb under their nav item.
  const isDetail = item && pathname !== item.href;

  return (
    <header className="no-print sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild>
              <Link href={home}>{ROLE_LABEL[role]}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {item && item.href !== home && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="min-w-0">
                {isDetail ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="truncate">
                      {item.title}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{item.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {isDetail && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Details</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <ThemeToggle />
    </header>
  );
}
