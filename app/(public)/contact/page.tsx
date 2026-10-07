import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenIcon, ClockIcon, CreditCardIcon, KeyRoundIcon } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the registrar's office about registration, grades, transcripts, tuition or account access.",
  openGraph: { title: "Contact the registrar · Quad", description: "Questions about registration, grades or fees? Get in touch." },
};

const selfService = [
  { icon: BookOpenIcon, title: "Registration & prerequisites", text: "See seats and prerequisites on each course page before you register.", href: "/courses", cta: "Browse courses" },
  { icon: CreditCardIcon, title: "Invoices & payments", text: "How tuition is calculated, when to recalculate and how Stripe checkout works.", href: "/tuition", cta: "Tuition FAQ" },
  { icon: KeyRoundIcon, title: "Signing in", text: "Students create their own account; instructor access is granted by the registrar.", href: "/login", cta: "Log in" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-8">
        <header className="space-y-4">
          <p className="text-sm font-medium tracking-wider text-primary uppercase">Contact</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Talk to the registrar&apos;s office</h1>
          <p className="text-lg text-muted-foreground">
            We handle registration problems, grade queries, transcript requests, tuition questions and account access.
          </p>
        </header>
        <div className="flex gap-3 rounded-3xl border bg-muted/30 p-5 text-sm">
          <ClockIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-medium">Office hours</p>
            <p className="text-muted-foreground">Sunday – Thursday, 9:00 – 17:00. Replies within two working days.</p>
            <a href={`mailto:${siteConfig.contactEmail}`} className="mt-1 inline-block font-medium text-primary hover:underline">
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>
        <section aria-labelledby="self-service" className="space-y-3">
          <h2 id="self-service" className="text-lg font-semibold">
            Quicker answers
          </h2>
          <ul className="space-y-3">
            {selfService.map((s) => (
              <li key={s.title} className="flex gap-3 rounded-2xl border bg-card p-4">
                <s.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div className="text-sm">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-muted-foreground">{s.text}</p>
                  <Link href={s.href} className="mt-1 inline-block font-medium text-primary hover:underline">
                    {s.cta} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ContactForm to={siteConfig.contactEmail} />
    </div>
  );
}
