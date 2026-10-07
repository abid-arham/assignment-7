"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  FileTextIcon,
  LockIcon,
  ReceiptIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LocalTime } from "@/components/shared/local-time";
import { Spinner } from "@/components/shared/spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { queries, queryKeys } from "@/lib/api/queries";
import type { InvoiceWithSemester, PaymentAttempt, Semester } from "@/lib/api/types";
import { formatDate, formatMoney, plural } from "@/lib/format";

interface TermBill {
  semester: Semester;
  enrolledCredits: number;
  invoice?: InvoiceWithSemester;
}

function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (semester: Semester) => api.generateInvoice(semester.id),
    onSuccess: (invoice, semester) => {
      toast.success(`Invoice ready for ${semester.name}`, {
        description: `${plural(invoice.totalCredits, "credit")} · ${formatMoney(invoice.amount)}`,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myInvoices });
    },
    onError: (error) => toast.error("Couldn't generate the invoice", { description: getErrorMessage(error) }),
  });
}

function usePayInvoice() {
  return useMutation({
    mutationFn: (invoiceId: string) => api.initiatePayment(invoiceId),
    onSuccess: ({ checkoutUrl }) => {
      toast.loading("Redirecting to Stripe Checkout…");
      // Stripe hosts the card form; it sends the student back to /payment/success or /payment/cancel.
      window.location.assign(checkoutUrl);
    },
    onError: (error) => toast.error("Couldn't start the payment", { description: getErrorMessage(error) }),
  });
}

function TermCard({ bill }: { bill: TermBill }) {
  const generate = useGenerateInvoice();
  const pay = usePayInvoice();
  const { semester, enrolledCredits, invoice } = bill;
  const rate = Number(semester.tuitionPerCredit);
  const outdated = invoice?.status === "UNPAID" && invoice.totalCredits !== enrolledCredits && enrolledCredits > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{semester.name}</CardTitle>
            <CardDescription>
              {plural(enrolledCredits, "credit")} enrolled · {formatMoney(rate)} per credit
            </CardDescription>
          </div>
          {invoice ? <StatusBadge status={invoice.status} /> : <StatusBadge status="NOT_INVOICED" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">{invoice ? "Invoice total" : "Estimated total"}</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">
            {formatMoney(invoice ? invoice.amount : enrolledCredits * rate)}
          </span>
        </div>
        {invoice?.status === "PAID" && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2Icon className="size-4" /> Paid on {formatDate(invoice.paidAt)}
          </p>
        )}
        {!invoice && (
          <p className="text-sm text-muted-foreground">
            Generate an invoice once your registration for this term is final. You can recalculate it after adding or
            dropping courses until it&apos;s paid.
          </p>
        )}
        {outdated && (
          <p className="flex gap-2 rounded-xl bg-warning/15 p-3 text-sm" role="status">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            Your registration changed since this invoice was issued ({plural(invoice!.totalCredits, "credit")} billed).
            Recalculate before paying.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {!invoice && (
          <Button onClick={() => generate.mutate(semester)} disabled={generate.isPending || enrolledCredits === 0}>
            {generate.isPending ? <Spinner /> : <FileTextIcon />} Generate invoice
          </Button>
        )}
        {invoice?.status === "UNPAID" && (
          <>
            <Button onClick={() => pay.mutate(invoice.id)} disabled={pay.isPending || pay.isSuccess || outdated}>
              {pay.isPending || pay.isSuccess ? <Spinner /> : <CreditCardIcon />}
              Pay {formatMoney(invoice.amount)} with Stripe
            </Button>
            <Button variant="outline" onClick={() => generate.mutate(semester)} disabled={generate.isPending}>
              {generate.isPending ? <Spinner /> : <RefreshCwIcon />} Recalculate
            </Button>
          </>
        )}
        {invoice?.status === "PAID" && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/enrollments">
              <ReceiptIcon /> View courses
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

const historyColumns: Column<PaymentAttempt & { semesterName: string }>[] = [
  { id: "date", header: "Date", cell: (p) => <LocalTime value={p.createdAt} /> },
  { id: "term", header: "Semester", cell: (p) => p.semesterName, className: "hidden sm:table-cell" },
  { id: "amount", header: "Amount", cell: (p) => formatMoney(p.amount), align: "right" },
  { id: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  {
    id: "note",
    header: "Note",
    cell: (p) => <span className="text-muted-foreground">{p.failureReason ?? "Stripe Checkout"}</span>,
    className: "hidden md:table-cell",
  },
];

export function PaymentsView() {
  const invoicesQuery = useQuery(queries.myInvoices(api));
  const enrollmentsQuery = useQuery(queries.myEnrollments(api));
  const [showAll, setShowAll] = useState(false);

  if (invoicesQuery.isPending || enrollmentsQuery.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }
  if (invoicesQuery.isError || enrollmentsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangleIcon}
        title="We couldn't load your billing"
        description={getErrorMessage(invoicesQuery.error ?? enrollmentsQuery.error)}
        action={
          <Button variant="outline" size="sm" onClick={() => void invoicesQuery.refetch().then(() => enrollmentsQuery.refetch())}>
            Try again
          </Button>
        }
      />
    );
  }

  const invoices = invoicesQuery.data;
  const bills = new Map<string, TermBill>();
  for (const e of enrollmentsQuery.data.filter((e) => e.status === "ENROLLED")) {
    const bill = bills.get(e.section.semesterId) ?? { semester: e.section.semester, enrolledCredits: 0 };
    bill.enrolledCredits += e.section.course.credits;
    bills.set(e.section.semesterId, bill);
  }
  for (const invoice of invoices) {
    const bill = bills.get(invoice.semesterId) ?? { semester: invoice.semester, enrolledCredits: 0 };
    bill.invoice = invoice;
    bills.set(invoice.semesterId, bill);
  }
  const terms = [...bills.values()].sort((a, b) => b.semester.startDate.localeCompare(a.semester.startDate));

  const history = invoices
    .flatMap((i) => (i.payments ?? []).map((p) => ({ ...p, semesterName: i.semester.name })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = showAll ? history : history.slice(0, 8);

  return (
    <div className="space-y-8">
      {terms.length === 0 ? (
        <EmptyState
          icon={CalculatorIcon}
          title="Nothing to bill yet"
          description="Tuition is calculated from the sections you're enrolled in. Register for courses first."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/register">Register for courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {terms.map((bill) => (
            <TermCard key={bill.semester.id} bill={bill} />
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <LockIcon className="size-3.5" /> Payments are processed by Stripe (test mode). Card details never touch Quad —
        use 4242 4242 4242 4242 with any future date and CVC.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Payment history</h2>
        <DataTable
          caption="Payment attempts"
          columns={historyColumns}
          rows={shown}
          getRowId={(p) => p.id}
          empty={
            <EmptyState
              icon={ReceiptIcon}
              title="No payment attempts yet"
              description="Each Stripe checkout you start — paid, pending or cancelled — is listed here."
            />
          }
        />
        {history.length > 8 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `Show all ${history.length}`}
          </Button>
        )}
      </section>
    </div>
  );
}
