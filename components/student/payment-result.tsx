import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PaymentSummary } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Receipt-style card shared by the Stripe success and cancel landing pages. */
export function PaymentResult({
  icon: Icon,
  tone,
  title,
  description,
  payment,
  actions,
}: {
  icon: LucideIcon;
  tone: "success" | "warning" | "neutral";
  title: string;
  description: string;
  payment?: PaymentSummary;
  actions: { href: string; label: string; primary?: boolean }[];
}) {
  return (
    <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
      <span
        className={cn(
          "mx-auto flex size-14 items-center justify-center rounded-full",
          tone === "success" && "bg-success/15 text-success",
          tone === "warning" && "bg-warning/20 text-warning",
          tone === "neutral" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      {payment && (
        <dl className="mt-6 grid grid-cols-2 gap-y-2 rounded-2xl bg-muted/60 p-4 text-left text-sm">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="text-right font-semibold tabular-nums">
            {formatMoney(payment.amount)} {payment.currency.toUpperCase()}
          </dd>
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="text-right">
            <StatusBadge status={payment.status} />
          </dd>
          <dt className="text-muted-foreground">Invoice</dt>
          <dd className="text-right">
            <StatusBadge status={payment.invoice.status} />
          </dd>
          {payment.invoice.paidAt && (
            <>
              <dt className="text-muted-foreground">Paid</dt>
              <dd className="text-right tabular-nums">{formatDateTime(payment.invoice.paidAt)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="truncate text-right font-mono text-xs leading-5">{payment.id}</dd>
        </dl>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {actions.map((a) => (
          <Button key={a.href} asChild variant={a.primary ? "default" : "outline"}>
            <Link href={a.href}>{a.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
