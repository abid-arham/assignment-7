import type { Metadata } from "next";
import { CheckCircle2Icon, SearchXIcon, XCircleIcon } from "lucide-react";
import { PaymentResult } from "@/components/student/payment-result";
import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "Payment cancelled", robots: { index: false } };

export default async function PaymentCancelPage({ searchParams }: PageProps<"/payment/cancel">) {
  const { payment_id: paymentId } = await searchParams;

  // The API expires the Stripe session first, so it can't be paid after we report it cancelled.
  const payment =
    typeof paymentId === "string" && paymentId
      ? await serverApi.cancelPayment(paymentId).catch((error: unknown) => {
          if (isApiError(error) && error.status === 404) return null;
          throw error;
        })
      : null;

  if (!payment) {
    return (
      <PaymentResult
        icon={SearchXIcon}
        tone="neutral"
        title="No payment to cancel"
        description="We couldn't find that checkout. Nothing was charged."
        actions={[{ href: "/dashboard/payments", label: "Back to payments", primary: true }]}
      />
    );
  }

  // Rare race: the card went through just before the student pressed back.
  if (payment.status === "SUCCEEDED") {
    return (
      <PaymentResult
        icon={CheckCircle2Icon}
        tone="success"
        title="This payment already went through"
        description="Stripe confirmed the charge before checkout was closed, so your invoice is paid."
        payment={payment}
        actions={[{ href: "/dashboard/payments", label: "View payments", primary: true }]}
      />
    );
  }

  return (
    <PaymentResult
      icon={XCircleIcon}
      tone="warning"
      title="Payment cancelled"
      description="You left Stripe Checkout before paying, so nothing was charged. Your invoice is still open whenever you're ready."
      payment={payment}
      actions={[
        { href: "/dashboard/payments", label: "Try again", primary: true },
        { href: "/dashboard", label: "Back to dashboard" },
      ]}
    />
  );
}
