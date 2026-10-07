"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 text-4xl font-medium sm:text-5xl">We could not load this page</h1>
      <p className="mt-4 max-w-md text-muted">This is usually temporary. Check your connection and try again.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">Try again</button>
      {error.digest && <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>}
    </main>
  );
}
