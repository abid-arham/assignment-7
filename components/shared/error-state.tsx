"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, HomeIcon, RotateCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Body of every error.tsx boundary: explains what happened, toasts once, and offers a retry that
 * re-fetches the segment (Next 16's `retry`). Server errors arrive sanitised in production, so the
 * message shown is ours; the digest lets the error be found in server logs.
 */
export function ErrorState({
  error,
  retry,
  title = "We couldn't load this page",
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  homeHref?: string;
}) {
  useEffect(() => {
    console.error(error);
    toast.error(title, { description: "The request failed. You can try again." });
  }, [error, title]);

  const isNetwork = error.name === "TypeError" || /fetch|network/i.test(error.message);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {isNetwork
            ? "We couldn't reach the university API. Check your connection, then try again."
            : "Something went wrong while loading this data. It's usually temporary — try again in a moment."}
        </p>
        {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => retry()}>
          <RotateCwIcon /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href={homeHref}>
            <HomeIcon /> Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
