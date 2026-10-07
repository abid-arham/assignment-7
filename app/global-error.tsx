"use client";

import "./globals.css";

/**
 * Replaces the root layout when it crashes, so it renders its own <html>/<body> and imports the
 * global styles itself. Kept dependency-free: the providers that failed may be the reason we're here.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center bg-background px-4 font-sans text-foreground">
        <title>Something went wrong · Quad</title>
        <div role="alert" className="max-w-md space-y-4 text-center">
          <p className="text-5xl" aria-hidden>
            ⚠︎
          </p>
          <h1 className="text-2xl font-semibold">Quad hit an unexpected error</h1>
          <p className="text-sm text-muted-foreground">
            The page couldn&apos;t be displayed. Try again — if it keeps happening, come back in a few minutes.
          </p>
          {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => retry()}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Try again
            </button>
            {/* A plain anchor on purpose: the router itself may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-2xl border px-4 py-2 text-sm font-medium hover:bg-muted">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
