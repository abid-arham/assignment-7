import type { Metadata } from "next";
import { CheckCircle2Icon, HourglassIcon, SearchXIcon } from "lucide-react";
import { PaymentResult } from "@/components/student/payment-result";
import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "Payment received", robots: { index: false } };

export default async function PaymentSuccessPage({ searchParams }: PageProps<"/payment/success">) {
  const { session_id: sessionId } = await searchParams;

  if (typeof sessionId !== "string" || !sessionId) {
    return (
      <PaymentResult
        icon={SearchXIcon}
        tone="neutral"
        title="No payment to confirm"
        description="This page is opened by Stripe after checkout. Start a payment from your tuition page."
        actions={[{ href: "/dashboard/payments", label: "Go to tuition & payments", primary: true }]}
      />
    );
  }

  // The API re-reads the Checkout Session from Stripe and marks the invoice paid (idempotent with the webhook).
  const payment = await serverApi.confirmPayment(sessionId).catch((error: unknown) => {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  });

  if (!payment) {
    return (
      <PaymentResult
        icon={SearchXIcon}
        tone="neutral"
        title="We couldn't find that checkout"
        description="The Stripe session doesn't match a payment on your account."
        actions={[{ href: "/dashboard/payments", label: "Back to payments", primary: true }]}
      />
    );
  }

  const paid = payment.status === "SUCCEEDED";
  return (
    <PaymentResult
      icon={paid ? CheckCircle2Icon : HourglassIcon}
      tone={paid ? "success" : "warning"}
      title={paid ? "Payment successful" : "Payment is processing"}
      description={
        paid
          ? "Your tuition invoice is marked as paid. A receipt is available from Stripe in your email."
          : "Stripe hasn't confirmed the charge yet. This page will show the final status once it does — check your payments in a minute."
      }
      payment={payment}
      actions={[
        { href: "/dashboard/payments", label: "View payments", primary: true },
        { href: "/dashboard", label: "Back to dashboard" },
      ]}
    />
  );
}
