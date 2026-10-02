import Link from "next/link";

export const metadata = { title: "Not authorised | Moses Studio Admin", robots: { index: false, follow: false } };

export default function Unauthorized() {
  return (
    <div className="admin-root flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Error 403</p>
      <h1 className="mt-3 text-4xl font-semibold">You do not have access to this page</h1>
      <p className="mt-3 max-w-md text-muted">This area is only available to Super Admins. Ask a Super Admin if you need access.</p>
      <Link href="/admin" className="btn btn-primary mt-8">Back to dashboard</Link>
    </div>
  );
}
