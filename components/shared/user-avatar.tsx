import Image from "next/image";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const sizes = { sm: 24, md: 32, lg: 40, xl: 96 } as const;

/** Avatar via next/image (Cloudinary is whitelisted in next.config.ts); initials when there's no photo. */
export function UserAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const px = sizes[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-medium text-primary ring-1 ring-border",
        className,
      )}
      style={{ width: px, height: px, fontSize: Math.max(10, Math.round(px * 0.38)) }}
    >
      {src ? (
        <Image src={src} alt={`${name}'s avatar`} fill sizes={`${px}px`} className="object-cover" />
      ) : (
        <span aria-hidden>{initials(name) || "?"}</span>
      )}
      {!src && <span className="sr-only">{name}</span>}
    </span>
  );
}
