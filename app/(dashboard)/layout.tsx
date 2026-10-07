import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AuthProvider } from "@/components/dashboard/auth-provider";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SessionKeeper } from "@/components/dashboard/session-keeper";
import { getSession, serverApi } from "@/lib/api/server";

/**
 * Shared shell for all three roles. Server Component: it loads the signed-in user once per navigation
 * and hands it to the client-side AuthProvider; the sidebar/header are Client Components because they
 * react to the current path and the collapsible state.
 */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, cookieStore] = await Promise.all([serverApi.me(), cookies()]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AuthProvider initialUser={user}>
      <SessionKeeper exp={session.exp} />
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          {/* SidebarInset is already the <main> landmark. */}
          <div id="main" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
