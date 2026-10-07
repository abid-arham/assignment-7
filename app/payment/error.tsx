"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PaymentError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} title="We couldn't confirm this payment" homeHref="/dashboard/payments" />;
}
