import Link from "next/link";
import { sql } from "@/lib/db";
import { PageHeader, Empty } from "@/components/admin/UI";

export default async function Dashboard() {
  const [stats] = await sql<Record<string, number>[]>`
    select count(*)::int as total,
      count(*) filter (where status = 'PRECIOUS')::int as precious,
      count(*) filter (where status = 'ONGOING')::int as ongoing,
      count(*) filter (where status = 'READY')::int as ready,
      count(*) filter (where published)::int as published,
      count(*) filter (where not published)::int as draft
    from ms_projects`;
  const [{ enquiries, unread }] = await sql<{ enquiries: number; unread: number }[]>`select count(*)::int as enquiries, count(*) filter (where not is_read)::int as unread from ms_contact_submissions`;
  const recent = await sql<{ id: string; name: string; subject: string; created_at: Date; is_read: boolean }[]>`select id, name, subject, created_at, is_read from ms_contact_submissions order by created_at desc limit 5`;

  const cards: [string, number, string?][] = [
    ["Total projects", stats.total], ["Precious works", stats.precious], ["Ongoing works", stats.ongoing], ["Ready works", stats.ready],
    ["Published", stats.published], ["Drafts", stats.draft], ["Contact enquiries", enquiries, unread ? `${unread} unread` : undefined],
  ];
  return (
    <>
      <PageHeader title="Dashboard" description="A live overview of your portfolio and enquiries." action={<Link href="/admin/projects/new" className="btn btn-primary btn-sm">Add project</Link>} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(([label, value, note]) => (
          <div key={label} className="admin-card !p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-4xl font-semibold tabular-nums">{value}</p>{note && <p className="mt-1 text-xs font-semibold text-accent">{note}</p>}</div>
        ))}
      </div>
      <h2 className="mb-4 mt-12 text-lg font-semibold">Latest enquiries</h2>
      {recent.length === 0 ? <Empty title="No enquiries yet" text="Messages sent through the website contact form will appear here." /> : (
        <ul className="admin-card divide-y divide-line !p-0">
          {recent.map((m) => (<li key={m.id}><Link href="/admin/messages" className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-bg"><span className="min-w-0"><span className="block truncate font-semibold">{m.subject}</span><span className="text-sm text-muted">{m.name}</span></span><span className="shrink-0 text-xs text-muted">{!m.is_read && <span className="badge mr-2 bg-accent text-accent-ink">New</span>}{new Date(m.created_at).toLocaleDateString("en-GB")}</span></Link></li>))}
        </ul>
      )}
    </>
  );
}
