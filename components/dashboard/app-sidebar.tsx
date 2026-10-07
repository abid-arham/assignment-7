"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/dashboard/auth-provider";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NAV, activeNavItem } from "@/components/dashboard/nav-config";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/auth/roles";

export function AppSidebar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const active = activeNavItem(role, pathname);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-1 px-3 py-3">
        <Logo href={ROLE_HOME[role]} showText={true} className="group-data-[collapsible=icon]:[&>span]:hidden" />
        <p className="pl-[2.375rem] text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {ROLE_LABEL[role]} workspace
        </p>
      </SidebarHeader>

      <SidebarContent>
        {NAV[role].map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active?.href === item.href} tooltip={item.title}>
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Course catalogue">
                  <Link href="/courses">
                    <CompassIcon />
                    <span>Course catalogue</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
