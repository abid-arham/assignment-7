import type { Metadata } from "next";
import Link from "next/link";
import { CompassIcon, HomeIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="relative space-y-6">
        <Logo className="justify-center" />
        <p className="font-heading text-8xl font-semibold text-primary/20 sm:text-9xl" aria-hidden>
          404
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">This page isn&apos;t on the timetable</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            The link may be old, or the course or section may have been removed. Try the catalogue or head back home.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">
              <HomeIcon /> Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/courses">
              <CompassIcon /> Course catalogue
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
