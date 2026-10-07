import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/site";

const groups = [
  {
    title: "Study",
    links: [
      { href: "/courses", label: "Course catalogue" },
      { href: "/tuition", label: "Tuition & fees" },
      { href: "/register", label: "Create an account" },
    ],
  },
  {
    title: "University",
    links: [
      { href: "/about", label: "About Quad" },
      { href: "/contact", label: "Contact the registrar" },
      { href: "/login", label: "Staff & student login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="font-sans text-sm font-semibold tracking-normal">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {siteConfig.fullName}. Payments run in Stripe test mode.
        </p>
      </div>
    </footer>
  );
}
