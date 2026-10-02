import { sql } from "@/lib/db";
import { Empty, PageHeader } from "@/components/admin/UI";

export default async function ActivityPage() {
  const rows = await sql<{ id: string; admin_email: string; action: string; entity: string; detail: string; created_at: Date }[]>`select id, admin_email, action, entity, detail, created_at from ms_activity_logs order by created_at desc limit 200`;
  return (
    <>
      <PageHeader title="Activity Log" description="The most recent 200 actions taken in the dashboard." />
      {rows.length === 0 ? <Empty title="No activity yet" text="Actions will be recorded here." /> : (
        <div className="admin-card overflow-x-auto !p-0">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Who</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Detail</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((r) => (<tr key={r.id}><td className="whitespace-nowrap px-5 py-3 text-muted">{new Date(r.created_at).toLocaleString("en-GB")}</td><td className="px-5 py-3">{r.admin_email || "-"}</td><td className="px-5 py-3 font-medium">{r.action}</td><td className="px-5 py-3 text-muted">{r.detail || r.entity}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
