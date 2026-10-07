import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

export function Logo({ href = "/", className, showText = true }: { href?: string; className?: string; showText?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <Image src="/quad-mark.svg" alt="" width={28} height={28} priority className="size-7 shrink-0" />
      {showText && (
        <span className="font-heading text-xl font-semibold leading-none tracking-tight">{siteConfig.name}</span>
      )}
    </Link>
  );
}
