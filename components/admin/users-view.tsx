"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/dashboard/auth-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { RoleBadge, StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { queries } from "@/lib/api/queries";
import { ROLES, type Paginated, type Role, type User } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import { adminUsersSearch, parseSearch } from "@/lib/search-params";

export const USERS_PAGE_SIZE = 10;

/** Patch one user inside every cached users page (all filters), returning the previous pages for rollback. */
function useUserMutation<V>(mutationFn: (user: User, value: V) => Promise<User>, apply: (user: User, value: V) => User) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ user, value }: { user: User; value: V }) => mutationFn(user, value),
    onMutate: async ({ user, value }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "users"] });
      const previous = queryClient.getQueriesData<Paginated<User>>({ queryKey: ["admin", "users"] });
      queryClient.setQueriesData<Paginated<User>>({ queryKey: ["admin", "users"] }, (page) =>
        page && { ...page, items: page.items.map((u) => (u.id === user.id ? apply(u, value) : u)) },
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error("Change not saved", { description: getErrorMessage(error) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function UsersView() {
  const { user: me } = useAuth();
  const { searchParams, setParams } = useQueryParams();
  const filters = parseSearch(adminUsersSearch, searchParams);
  const { data, isPending, isFetching } = useQuery(queries.users(api, { ...filters, limit: USERS_PAGE_SIZE }));
  const [pendingRole, setPendingRole] = useState<{ user: User; role: Role } | null>(null);

  const changeStatus = useUserMutation<boolean>(
    (user, isActive) => api.changeStatus(user.id, isActive),
    (user, isActive) => ({ ...user, isActive }),
  );
  const changeRole = useUserMutation<Role>(
    (user, role) => api.changeRole(user.id, role),
    (user, role) => ({ ...user, role }),
  );

  const columns: Column<User>[] = [
    {
      id: "user",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={u.name} src={u.avatarUrl} className="hidden sm:inline-flex" />
          <div className="min-w-0 max-w-36 sm:max-w-none">
            <p className="truncate font-medium">
              {u.name} {u.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (u) =>
        u.id === me.id ? (
          <RoleBadge role={u.role} />
        ) : (
          <Select value={u.role} onValueChange={(role) => setPendingRole({ user: u, role: role as Role })}>
            <SelectTrigger size="sm" className="w-28 sm:w-32" aria-label={`Role for ${u.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
    },
    { id: "code", header: "Student ID", cell: (u) => u.studentCode ?? "—", className: "hidden lg:table-cell font-mono text-xs" },
    { id: "joined", header: "Joined", cell: (u) => formatDate(u.createdAt), className: "hidden md:table-cell text-muted-foreground" },
    {
      id: "status",
      header: "Active",
      align: "right",
      cell: (u) => (
        <div className="flex items-center justify-end gap-2">
          <StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} className="hidden sm:inline-flex" />
          <Switch
            checked={u.isActive}
            disabled={u.id === me.id}
            onCheckedChange={(isActive) => {
              changeStatus.mutate(
                { user: u, value: isActive },
                {
                  onSuccess: () =>
                    toast.success(`${u.name} ${isActive ? "reactivated" : "deactivated"}`, {
                      description: isActive ? undefined : "Their sessions were signed out.",
                    }),
                },
              );
            }}
            aria-label={`${u.isActive ? "Deactivate" : "Activate"} ${u.name}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={filters.q ?? ""}
          onSearch={(q) => setParams({ q }, { replace: true })}
          placeholder="Search name or email"
          label="Search users"
        />
        <Select value={filters.role ?? "all"} onValueChange={(v) => setParams({ role: v === "all" ? null : v })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}s
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        caption="Users"
        columns={columns}
        rows={data?.items}
        getRowId={(u) => u.id}
        isLoading={isPending}
        isFetching={isFetching}
        rowClassName={(u) => (u.isActive ? undefined : "opacity-60")}
        empty={
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description="No account matches this search and role. Try a broader search."
          />
        }
      />
      {data && (
        <PaginationBar
          page={data.meta.page}
          pageSize={data.meta.limit}
          total={data.meta.total}
          onPageChange={(page) => setParams({ page })}
        />
      )}

      <ConfirmDialog
        open={pendingRole !== null}
        onOpenChange={(open) => !open && setPendingRole(null)}
        title={pendingRole ? `Make ${pendingRole.user.name} ${ROLE_LABEL[pendingRole.role].toLowerCase()}?` : ""}
        description="Their dashboard and permissions change the next time their session refreshes. The change is recorded in the audit log."
        confirmLabel="Change role"
        onConfirm={() => {
          if (!pendingRole) return;
          const { user, role } = pendingRole;
          changeRole.mutate(
            { user, value: role },
            { onSuccess: () => toast.success(`${user.name} is now ${ROLE_LABEL[role].toLowerCase()}`) },
          );
          setPendingRole(null);
        }}
      />
    </div>
  );
}
