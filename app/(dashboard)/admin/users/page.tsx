import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { USERS_PAGE_SIZE, UsersView } from "@/components/admin/users-view";
import { PageHeader } from "@/components/shared/page-header";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";
import { adminUsersSearch, parseSearch } from "@/lib/search-params";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const filters = parseSearch(adminUsersSearch, await searchParams);
  // Same params object as the client builds from useSearchParams → same query key → no refetch on hydrate.
  const state = await prefetch((qc) => qc.prefetchQuery(queries.users(serverApi, { ...filters, limit: USERS_PAGE_SIZE })));

  return (
    <>
      <PageHeader
        title="Users"
        description="Search every account, promote students to instructors, and deactivate accounts. Deactivating signs the user out everywhere."
      />
      <HydrationBoundary state={state}>
        <UsersView />
      </HydrationBoundary>
    </>
  );
}
