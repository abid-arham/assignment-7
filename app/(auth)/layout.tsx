import { BookOpenCheckIcon, CreditCardIcon, ShieldCheckIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  { icon: BookOpenCheckIcon, text: "Register for sections with live seat counts and prerequisite checks." },
  { icon: ShieldCheckIcon, text: "Instructors grade their own sections; GPA updates the moment they do." },
  { icon: CreditCardIcon, text: "Generate your tuition invoice and pay it securely with Stripe." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-highlight/25 blur-3xl"
          aria-hidden
        />
        <Logo className="relative text-primary-foreground" />
        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl leading-tight font-semibold">Your whole semester, from registration to receipt.</h2>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-primary-foreground/85">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Icon className="size-4" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          Students, instructors and the registrar&apos;s office share one system.
        </p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
