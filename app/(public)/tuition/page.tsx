import type { Metadata } from "next";
import { CalendarRangeIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FeeCalculator } from "@/components/site/fee-calculator";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { publicApi } from "@/lib/api/server";
import { formatDateRange, formatMoney } from "@/lib/format";
import { semesterPhase } from "@/lib/semesters";

export const metadata: Metadata = {
  title: "Tuition & fees",
  description: "Per-credit tuition for every semester, a fee calculator and answers to common questions about invoices and payments.",
  openGraph: { title: "Tuition & fees · Quad", description: "Per-credit tuition for every semester and how paying works." },
};

const faqs = [
  {
    q: "How is my tuition calculated?",
    a: "Tuition is your enrolled credits for a semester multiplied by that semester's per-credit rate. Dropped courses don't count, and there are no hidden fees.",
  },
  {
    q: "When should I generate my invoice?",
    a: "Once your registration for the term is final. If you add or drop a course afterwards, use “Recalculate” on the Tuition & payments page before paying — an unpaid invoice always follows your current enrollments.",
  },
  {
    q: "How do I pay?",
    a: "From Tuition & payments, choose “Pay with Stripe”. You're taken to Stripe's secure checkout and brought back to a confirmation page. Quad never sees or stores your card number.",
  },
  {
    q: "What if I close the checkout page?",
    a: "Nothing is charged. The checkout is cancelled, your invoice stays open, and you can start a new payment whenever you're ready.",
  },
  {
    q: "Can I change courses after paying?",
    a: "A paid invoice is locked so your receipt always matches what you paid. Contact the registrar's office if your enrollment needs to change after payment.",
  },
  {
    q: "Does a retake cost the same as the first attempt?",
    a: "Yes — a retaken course is billed by its credits like any other. Only your best attempt counts toward GPA.",
  },
];

export default async function TuitionPage() {
  const semesters = await publicApi.semesters();

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-16 sm:px-6">
      <header className="max-w-2xl space-y-4">
        <p className="text-sm font-medium tracking-wider text-primary uppercase">Tuition & fees</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Simple, per-credit pricing</h1>
        <p className="text-lg text-muted-foreground">
          You pay for the credits you take — nothing else. Rates are set per semester by the registrar and shown here as
          soon as a term is announced.
        </p>
      </header>

      <section aria-labelledby="rates-heading" className="space-y-4">
        <h2 id="rates-heading" className="text-2xl font-semibold">
          Rates by semester
        </h2>
        {semesters.length === 0 ? (
          <EmptyState icon={CalendarRangeIcon} title="No semesters announced yet" description="Rates appear here once the registrar publishes the next term." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map((s) => (
              <article key={s.id} className="rounded-3xl border bg-card p-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <StatusBadge status={s.enrollmentOpen ? "OPEN" : "CLOSED"} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateRange(s.startDate, s.endDate)} · {semesterPhase(s) === "past" ? "finished" : semesterPhase(s) === "current" ? "in session" : "upcoming"}
                </p>
                <p className="mt-6 font-heading text-4xl font-semibold tabular-nums">
                  {formatMoney(s.tuitionPerCredit)}
                  <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">/ credit</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A 3-credit course costs {formatMoney(Number(s.tuitionPerCredit) * 3)}.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {semesters.length > 0 && <FeeCalculator semesters={semesters} />}

      <section aria-labelledby="faq-heading" className="space-y-4">
        <h2 id="faq-heading" className="text-2xl font-semibold">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="rounded-3xl border bg-card px-6">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
