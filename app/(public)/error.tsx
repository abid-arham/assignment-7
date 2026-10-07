"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PublicError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="px-4">
      <ErrorState error={error} retry={retry} />
    </div>
  );
}
