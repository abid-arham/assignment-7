"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDownIcon, HomeIcon, LogOutIcon, UserCircleIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/dashboard/auth-provider";
import { RoleBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { logoutAction } from "@/lib/auth/actions";
import { ROLE_HOME } from "@/lib/auth/roles";

export function UserMenu() {
  const { user, role } = useAuth();
  const { isMobile } = useSidebar();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      // Drop cached data of this account before the next one signs in on the same tab.
      queryClient.clear();
      await logoutAction();
    });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" aria-label="Account menu">
              <UserAvatar name={user.name} src={user.avatarUrl} />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="flex items-center gap-3 font-normal">
              <UserAvatar name={user.name} src={user.avatarUrl} size="lg" />
              <span className="grid min-w-0 gap-1">
                <span className="truncate font-medium">{user.name}</span>
                <RoleBadge role={role} />
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`${ROLE_HOME[role]}/profile`}>
                  <UserCircleIcon /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/">
                  <HomeIcon /> Public site
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} disabled={pending} variant="destructive">
              <LogOutIcon /> {pending ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
