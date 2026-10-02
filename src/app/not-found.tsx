import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">The page you are looking for does not exist or is no longer published.</p>
      <Link href="/" className="btn btn-primary mt-8">Back to Moses Studio</Link>
    </main>
  );
}
