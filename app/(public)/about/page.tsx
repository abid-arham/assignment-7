import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseZapIcon, EyeIcon, LockKeyholeIcon, ScaleIcon, ServerCogIcon, UsersRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Quad exists and how it keeps registration fair, grades accurate and payments safe for students, instructors and the registrar.",
  openGraph: { title: "About Quad", description: "How Quad keeps registration fair, grades accurate and payments safe." },
};

const principles = [
  {
    icon: ScaleIcon,
    title: "Fair registration",
    text: "A seat is claimed with a single conditional database update, so two students racing for the last place can never both get it. Dropped seats are released immediately.",
  },
  {
    icon: DatabaseZapIcon,
    title: "Rules enforced at the source",
    text: "Prerequisites, capacity limits, enrollment windows and grade permissions are checked by the server on every request — the interface explains them, it doesn't replace them.",
  },
  {
    icon: EyeIcon,
    title: "Everything leaves a trail",
    text: "Enrollments, drops, grades, role changes and payments are written to an audit log inside the same transaction as the change, so the record can't drift from reality.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Private by default",
    text: "Sessions live in httpOnly cookies the browser's JavaScript can't read. Card details go straight to Stripe and never touch our servers.",
  },
];

const facts = [
  { icon: UsersRoundIcon, label: "Three workspaces", text: "Student, instructor and registrar views, each showing only what that role may do." },
  { icon: ServerCogIcon, label: "One source of truth", text: "Catalogue, enrollments, grades and fees share a single PostgreSQL database behind a REST API." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6">
      <header className="max-w-3xl space-y-5">
        <p className="text-sm font-medium tracking-wider text-primary uppercase">About Quad</p>
        <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
          A university runs on hundreds of small decisions every term. Quad makes them visible.
        </h1>
        <p className="text-lg text-muted-foreground">
          Registration queues, spreadsheets of grades and paper fee slips create the same problems every semester: oversold
          sections, students blocked by prerequisites they didn&apos;t know about, and invoices that don&apos;t match what was
          taken. Quad replaces them with one system that the student, the instructor and the registrar all look at.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.label} className="flex gap-4 rounded-3xl border bg-card p-6">
            <f.icon className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold">{f.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">What we hold ourselves to</h2>
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="space-y-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-xl font-semibold">{p.title}</h3>
              <p className="text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-muted/30 p-8 sm:p-10">
        <h2 className="text-2xl font-semibold">How grades become a GPA</h2>
        <div className="mt-4 grid gap-6 text-sm text-muted-foreground md:grid-cols-3">
          <p>
            <span className="font-semibold text-foreground">Letter to points.</span> A+ and A earn 4.0, down through B (3.0),
            C (2.0) and D (1.0); F earns nothing. D or better counts as a pass for prerequisites.
          </p>
          <p>
            <span className="font-semibold text-foreground">Weighted by credits.</span> A 4-credit course moves your GPA
            more than a 1-credit lab. Term GPA covers one semester; cumulative GPA covers all of them.
          </p>
          <p>
            <span className="font-semibold text-foreground">Retakes replace.</span> If you repeat a course, only your best
            attempt counts toward GPA and credits — every attempt still appears on your transcript.
          </p>
        </div>
      </section>

      <section className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-lg">Questions about registration, grades or fees? The registrar&apos;s office can help.</p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/tuition">Tuition & fees</Link>
          </Button>
          <Button asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
