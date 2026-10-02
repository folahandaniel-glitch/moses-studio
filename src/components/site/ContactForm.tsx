"use client";
import { useActionState, useEffect, useState } from "react";
import { submitContact, type ContactState } from "@/app/actions/contact";
import { Icon } from "../Icon";

const initial: ContactState = { status: "idle" };

export function ContactForm() {
  const [renderedAt, setRenderedAt] = useState(0);
  useEffect(() => setRenderedAt(Date.now()), []);
  const [state, action, pending] = useActionState(submitContact, initial);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-ink"><Icon name="check" /></span>
        <h3 className="text-2xl">Message sent</h3>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }

  const Field = ({ name, label, type = "text", autoComplete, required = true }: { name: string; label: string; type?: string; autoComplete?: string; required?: boolean }) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">{label}{!required && <span className="text-muted"> (optional)</span>}</label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} required={required} aria-invalid={!!err(name)} aria-describedby={err(name) ? `${name}-err` : undefined} defaultValue={state.values?.[name]} className="field" />
      {err(name) && <p id={`${name}-err`} className="mt-1.5 text-sm font-medium text-red-600">{err(name)}</p>}
    </div>
  );

  return (
    <form action={action} noValidate className="space-y-5" aria-describedby={state.status === "error" ? "form-error" : undefined}>
      <input type="hidden" name="rendered_at" value={renderedAt} />
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Your name" autoComplete="name" />
        <Field name="email" label="Email address" type="email" autoComplete="email" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" required={false} />
        <Field name="subject" label="Subject" />
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">Message</label>
        <textarea id="message" name="message" rows={6} required aria-invalid={!!err("message")} aria-describedby={err("message") ? "message-err" : undefined} defaultValue={state.values?.message} className="field resize-y" />
        {err("message") && <p id="message-err" className="mt-1.5 text-sm font-medium text-red-600">{err("message")}</p>}
      </div>
      {state.status === "error" && state.message && <p id="form-error" role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending ? "Sending..." : "Send message"} {!pending && <Icon name="arrow" className="h-4 w-4" />}
      </button>
    </form>
  );
}
