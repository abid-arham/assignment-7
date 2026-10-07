import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BookOpenCheckIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  GraduationCapIcon,
  PresentationIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeatMeter } from "@/components/shared/seat-meter";
import { publicApi } from "@/lib/api/server";
import { formatDateRange, formatMoney, plural } from "@/lib/format";
import { openSemesters } from "@/lib/semesters";

// Statically rendered and refreshed in the background: catalogue data is cached for 60 s (publicFetch).

const roles = [
  {
    icon: GraduationCapIcon,
    title: "Students",
    tone: "bg-highlight/20 text-highlight-foreground dark:text-highlight",
    points: ["Build a registration plan with live seat counts", "Prerequisites checked before you commit", "Transcript with term and cumulative GPA", "Pay tuition online with Stripe"],
  },
  {
    icon: PresentationIcon,
    title: "Instructors",
    tone: "bg-success/15 text-success",
    points: ["Every section you teach, by semester", "Rosters with search and grading status", "Submit final grades in a couple of clicks", "Grade distributions and pass rates"],
  },
  {
    icon: ShieldCheckIcon,
    title: "Registrar",
    tone: "bg-primary/10 text-primary",
    points: ["Departments, courses and prerequisite chains", "Semesters, sections and capacities", "Promote, deactivate and audit accounts", "Live enrollment and revenue dashboards"],
  },
];

const flow = [
  { icon: CalendarCheckIcon, title: "Registrar opens the term", text: "Semesters, sections and tuition rates are set up and enrollment is switched on." },
  { icon: ClipboardCheckIcon, title: "Students register", text: "Seats are claimed atomically and prerequisites are verified, so no section is ever oversold." },
  { icon: BadgeCheckIcon, title: "Instructors grade", text: "Final grades complete the course and flow straight into each student's GPA." },
  { icon: CreditCardIcon, title: "Fees are settled", text: "Invoices are calculated from enrolled credits and paid through Stripe Checkout." },
];

export default async function HomePage() {
  const [catalogue, departments, semesters] = await Promise.all([
    publicApi.courses({ limit: 100, sortBy: "code" }),
    publicApi.departments(),
    publicApi.semesters(),
  ]);
  const open = openSemesters(semesters)[0];
  const sections = open ? await publicApi.sections({ semesterId: open.id }) : [];
  const featured = [...sections].sort((a, b) => b.enrolledCount / b.capacity - a.enrolledCount / a.capacity).slice(0, 3);
  const seatsLeft = sections.reduce((sum, s) => sum + Math.max(s.capacity - s.enrolledCount, 0), 0);

  const stats = [
    { label: "Courses in the catalogue", value: catalogue.meta.total },
    { label: "Academic departments", value: departments.length },
    { label: open ? `Sections in ${open.name}` : "Sections this term", value: sections.length },
    { label: "Open seats right now", value: seatsLeft },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center space-y-6">
            {open ? (
              <Badge variant="secondary" className="h-7 w-fit gap-1.5 bg-success/15 px-3 text-success">
                <SparklesIcon /> {open.name} registration is open
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-7 w-fit px-3">Registration opens soon</Badge>
            )}
            <h1 className="text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
              The academic year, <span className="text-primary">without the paperwork.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Quad brings course registration, grading, transcripts and tuition payments into one place for students,
              instructors and the registrar&apos;s office.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/courses">
                  Browse courses <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Try a demo account</Link>
              </Button>
            </div>
          </div>

          {/* A live slice of this term's sections */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-highlight/20 blur-2xl" aria-hidden />
            <div className="relative rounded-3xl border bg-card p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b pb-4">
                <div>
                  <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Filling up fastest</p>
                  <p className="font-heading text-xl font-semibold">{open?.name ?? "Next term"}</p>
                </div>
                {open && (
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{formatDateRange(open.startDate, open.endDate)}</p>
                    <p>{formatMoney(open.tuitionPerCredit)} per credit</p>
                  </div>
                )}
              </div>
              {featured.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Sections will be published when registration opens.</p>
              ) : (
                <ul className="divide-y">
                  {featured.map((s) => (
                    <li key={s.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_10rem] sm:items-center">
                      <div className="min-w-0">
                        <Link href={`/courses/${s.courseId}`} className="font-medium hover:underline">
                          {s.course.code} · {s.course.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Section {s.sectionCode} · {s.instructor.name} · {plural(s.course.credits, "credit")}
                        </p>
                      </div>
                      <SeatMeter taken={s.enrolledCount} capacity={s.capacity} />
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="secondary" className="mt-2 w-full">
                <Link href="/login">Register for {open?.name ?? "classes"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live numbers */}
      <section aria-label="Quad in numbers" className="border-b bg-muted/30">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="font-heading text-4xl font-semibold tabular-nums">{s.value}</dd>
              <dt className="mt-1 text-sm text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium tracking-wider text-primary uppercase">One system, three workspaces</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">Everyone sees exactly what they need</h2>
          <p className="text-muted-foreground">
            Each role signs in to its own workspace. Students never see admin tools, instructors only see their own
            sections, and every sensitive change is logged.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <article key={role.title} className="rounded-3xl border bg-card p-6 shadow-xs">
              <span className={`flex size-11 items-center justify-center rounded-xl ${role.tone}`}>
                <role.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{role.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {role.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <BookOpenCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold sm:text-4xl">How a semester flows through Quad</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {flow.map((step, i) => (
              <li key={step.title} className="relative rounded-3xl border bg-card p-6">
                <span className="font-heading text-5xl font-semibold text-primary/15">{String(i + 1).padStart(2, "0")}</span>
                <step.icon className="absolute top-6 right-6 size-5 text-primary" aria-hidden />
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Departments */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">Departments</h2>
          <Button asChild variant="ghost">
            <Link href="/courses">
              Full catalogue <ArrowRightIcon />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((d) => {
            const count = catalogue.items.filter((c) => c.departmentId === d.id).length;
            return (
              <Link
                key={d.id}
                href={`/courses?departmentId=${d.id}`}
                className="group rounded-3xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="font-heading text-2xl font-semibold text-primary">{d.code}</span>
                <p className="mt-1 font-medium">{d.name}</p>
                <p className="mt-4 flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                  {plural(count, "course")} <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground sm:px-12">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-10" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl space-y-2">
              <h2 className="text-3xl font-semibold">See it from every side</h2>
              <p className="text-primary-foreground/80">
                One-click demo accounts let you explore Quad as a student, an instructor or the registrar — with real data.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">
                Open the demo <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
