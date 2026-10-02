"use client";
import { useState, type FormHTMLAttributes } from "react";
import { usePathname, useRouter } from "next/navigation";

type Result = { redirect?: string; error?: string } | void;

interface Props extends Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit" | "onError"> {
  action: (form: FormData) => Promise<unknown>;
  onError?: (message: string) => void;
}

/**
 * Submits a form to a server action and follows the redirect it returns.
 * A full page load is used for the redirect so the dashboard always shows fresh data.
 */
export function ActionForm({ action, onError, children, ...rest }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const result = (await action(new FormData(e.currentTarget))) as Result;
      if (result?.error) onError?.(result.error);
      if (result?.redirect) {
        const target = new URL(result.redirect, window.location.origin);
        if (target.pathname === pathname && !target.search) router.refresh();
        else window.location.assign(target.pathname + target.search);
        return;
      }
    } catch {
      onError?.("Something went wrong. Please check your connection and try again.");
      window.location.assign(`${pathname}?error=${encodeURIComponent("Something went wrong. Please try again.")}`);
    }
    setPending(false);
  }

  return <form {...rest} onSubmit={onSubmit} aria-busy={pending}>{children}</form>;
}
