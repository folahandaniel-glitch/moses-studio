"use server";
import { sql } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getSiteData } from "@/lib/content";

export interface ContactState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
}

async function notifyByEmail(to: string, data: { name: string; email: string; phone?: string; subject: string; message: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Moses Studio <onboarding@resend.dev>",
        to: [to],
        reply_to: data.email,
        subject: `New enquiry: ${data.subject}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || "-"}\n\n${data.message}`,
      }),
    });
  } catch (err) {
    console.error("contact email failed", err instanceof Error ? err.message : err);
  }
}

export async function submitContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  const values = Object.fromEntries(["name", "email", "phone", "subject", "message"].map((k) => [k, String(form.get(k) ?? "")]));

  // Honeypot and minimum fill time quietly discard most bots.
  const renderedAt = Number(form.get("rendered_at"));
  const tooFast = Number.isFinite(renderedAt) && Date.now() - renderedAt < 2500;
  if (form.get("website") || tooFast) return { status: "success", message: "Thank you. We will be in touch shortly." };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  try {
    if (!(await rateLimit(`contact:${await clientIp()}`, 5, 3600))) {
      return { status: "error", message: "Too many messages from this connection. Please try again later or contact us by phone or WhatsApp.", values };
    }
    const d = parsed.data;
    await sql`insert into contact_submissions (name, email, phone, subject, message) values (${d.name}, ${d.email}, ${d.phone ?? ""}, ${d.subject}, ${d.message})`;
    const { blocks } = await getSiteData();
    await notifyByEmail(blocks.contact.notify_email || process.env.CONTACT_NOTIFY_EMAIL || "", d);
    return { status: "success", message: "Thank you. We have received your message and will reply as soon as possible." };
  } catch (err) {
    console.error("contact submit failed", err instanceof Error ? err.message : err);
    return { status: "error", message: "We could not send your message right now. Please try again, or reach us by phone or WhatsApp.", values };
  }
}
