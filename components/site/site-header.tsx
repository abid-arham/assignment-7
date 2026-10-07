"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, LogInIcon, MenuIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export const SITE_NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/tuition", label: "Tuition & fees" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Account buttons depend on the visitor's session, fetched client-side so the page itself stays static. */
function AccountActions({ stacked = false, onNavigate }: { stacked?: boolean; onNavigate?: () => void }) {
  const { data: session, isPending } = useSession();

  if (isPending) return <Skeleton className={cn("h-8 rounded-2xl", stacked ? "w-full" : "w-40")} />;

  if (session) {
    return (
      <Button asChild className={cn(stacked && "w-full")} onClick={onNavigate}>
        <Link href={ROLE_HOME[session.role]}>
          <LayoutDashboardIcon /> Go to dashboard
        </Link>
      </Button>
    );
  }

  return (
    <div className={cn("flex gap-2", stacked && "flex-col")}>
      <Button asChild variant="ghost" className={cn(stacked && "w-full")} onClick={onNavigate}>
        <Link href="/login">
          <LogInIcon /> Log in
        </Link>
      </Button>
      <Button asChild className={cn(stacked && "w-full")} onClick={onNavigate}>
        <Link href="/register">Apply as a student</Link>
      </Button>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {SITE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(item.href) && "bg-muted font-medium text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:block">
            <AccountActions />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="grid gap-1 px-4">
                {SITE_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn("rounded-xl px-3 py-2 hover:bg-muted", isActive(item.href) && "bg-muted font-medium")}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4">
                <AccountActions stacked onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
