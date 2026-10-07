import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileView } from "@/components/profile/profile-view";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { serverApi } from "@/lib/api/server";

/** Profile & settings page shared by all three roles (each role routes to it under its own area). */
export async function ProfilePage() {
  const state = await prefetch((qc) => qc.prefetchQuery(queries.departments(serverApi)));
  return (
    <>
      <PageHeader title="Profile & settings" description="Update your name and photo. Changes show up everywhere instantly." />
      <HydrationBoundary state={state}>
        <ProfileView />
      </HydrationBoundary>
    </>
  );
}
