"use client";
import { useState } from "react";
import { ActionForm } from "@/components/admin/ActionForm";
import { login } from "../actions";

export function LoginForm() {
  const [error, setError] = useState("");
  return (
    <ActionForm action={login} onError={setError} className="space-y-5">
      <div><label htmlFor="email" className="admin-label">Email address</label><input id="email" name="email" type="email" autoComplete="username" required className="field" /></div>
      <div><label htmlFor="password" className="admin-label">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      <button type="submit" className="btn btn-primary w-full">Sign in</button>
    </ActionForm>
  );
}
