import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in | Moses Studio Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="admin-root flex min-h-[100svh] items-center justify-center px-5">
      <div className="w-full max-w-md">
        <p className="text-center font-semibold tracking-tight">Moses Studio</p>
        <h1 className="mt-2 text-center text-3xl font-semibold">Admin sign in</h1>
        <div className="admin-card mt-8"><LoginForm /></div>
      </div>
    </div>
  );
}
