"use client";

import { ErrorState } from "@/components/shared/error-state";

// Catches failures in any dashboard page while keeping the sidebar shell usable.
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/" />;
}
