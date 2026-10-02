import { ActionForm } from "@/components/admin/ActionForm";
import { sql } from "@/lib/db";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Empty, PageHeader, first, type SearchParams } from "@/components/admin/UI";
import { deleteMessage, toggleMessageRead } from "../../actions";

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rows = await sql<{ id: string; name: string; email: string; phone: string; subject: string; message: string; is_read: boolean; created_at: Date }[]>`select * from contact_submissions order by created_at desc limit 200`;
  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent through the website contact form." sp={{ notice: first(sp.notice), error: first(sp.error) }} />
      {rows.length === 0 ? <Empty title="No enquiries yet" text="When a visitor uses the contact form their message will appear here." /> : (
        <ul className="space-y-4">
          {rows.map((m) => (
            <li key={m.id} className={`admin-card ${m.is_read ? "" : "border-accent"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-semibold">{m.subject} {!m.is_read && <span className="badge ml-2 bg-accent text-accent-ink">New</span>}</p>
                  <p className="text-sm text-muted">{m.name} &middot; <a className="underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <> &middot; <a className="underline" href={`tel:${m.phone}`}>{m.phone}</a></>}</p></div>
                <time className="text-xs text-muted" dateTime={new Date(m.created_at).toISOString()}>{new Date(m.created_at).toLocaleString("en-GB")}</time>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
              <div className="mt-4 flex gap-2">
                <ActionForm action={toggleMessageRead}><input type="hidden" name="id" value={m.id} /><button className="btn btn-outline btn-sm">{m.is_read ? "Mark unread" : "Mark read"}</button></ActionForm>
                <ActionForm action={deleteMessage}><input type="hidden" name="id" value={m.id} /><ConfirmButton message="This enquiry will be permanently deleted.">Delete</ConfirmButton></ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
