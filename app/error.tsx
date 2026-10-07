"use client";

import { ErrorState } from "@/components/shared/error-state";

// Last boundary inside the root layout (auth pages and anything without a closer error.tsx).
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <ErrorState error={error} retry={retry} />
    </div>
  );
}
