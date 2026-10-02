import { ActionForm } from "@/components/admin/ActionForm";
import Image from "next/image";
import Link from "next/link";
import { sql } from "@/lib/db";
import { PROJECT_STATUSES, STATUS_SHORT, type ProjectStatus } from "@/lib/types";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Empty, PageHeader, PublishBadge, StatusBadge, first, type SearchParams } from "@/components/admin/UI";
import { deleteProject, duplicateProject, moveProject, quickUpdateProject } from "../../actions";

interface Row { id: string; title: string; slug: string; status: ProjectStatus; featured: boolean; published: boolean; featured_image_url: string; category_name: string | null }

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (first(sp.q) ?? "").trim().slice(0, 100);
  const status = PROJECT_STATUSES.find((s) => s === first(sp.status));
  const state = first(sp.state);
  const rows = await sql<Row[]>`
    select p.id, p.title, p.slug, p.status, p.featured, p.published, p.featured_image_url, c.name as category_name
    from projects p left join categories c on c.id = p.category_id
    where (${q} = '' or p.title ilike ${"%" + q.replace(/[%_]/g, "") + "%"})
      and (${status ?? null}::project_status is null or p.status = ${status ?? null}::project_status)
      and (${state ?? ""} = '' or (${state ?? ""} = 'published' and p.published) or (${state ?? ""} = 'draft' and not p.published))
    order by p.sort_order, p.created_at desc`;
  const total = rows.length;
  const h = (k: string, v: string) => <input type="hidden" name={k} value={v} />;

  return (
    <>
      <PageHeader title="Portfolio" description="Every project on your website. Change status, order and visibility here." sp={{ notice: first(sp.notice), error: first(sp.error) }}
        action={<Link href="/admin/projects/new" className="btn btn-primary btn-sm">Add project</Link>} />
      <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search projects" aria-label="Search projects" className="field" />
        <select name="status" defaultValue={status ?? ""} aria-label="Filter by status" className="field"><option value="">All statuses</option>{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_SHORT[s]}</option>)}</select>
        <select name="state" defaultValue={state ?? ""} aria-label="Filter by visibility" className="field"><option value="">Published and drafts</option><option value="published">Published</option><option value="draft">Drafts</option></select>
        <button className="btn btn-outline">Filter</button>
      </form>
      {total === 0 ? <Empty title="No projects found" text={q || status || state ? "Try different filters." : "Add your first project to see it on the website."} href="/admin/projects/new" cta="Add project" /> : (
        <ul className="admin-card divide-y divide-line !p-0">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-bg">{r.featured_image_url && <Image src={r.featured_image_url} alt="" fill sizes="96px" className="object-cover" unoptimized />}</div>
              <div className="min-w-0 flex-1 basis-48">
                <Link href={`/admin/projects/${r.id}`} className="block truncate font-semibold hover:text-accent">{r.title}</Link>
                <p className="mt-0.5 text-sm text-muted">{r.category_name ?? "No category"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={r.status} /><PublishBadge published={r.published} />{r.featured && <span className="badge bg-violet-100 text-violet-900">&#9733; Featured</span>}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ActionForm action={quickUpdateProject} className="flex gap-1">{h("id", r.id)}{h("field", "status")}
                  <select name="status" defaultValue={r.status} aria-label={`Status of ${r.title}`} className="field !w-auto !py-1.5 text-sm">{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_SHORT[s]}</option>)}</select>
                  <button className="btn btn-outline btn-sm">Set</button></ActionForm>
                <ActionForm action={quickUpdateProject}>{h("id", r.id)}{h("field", "published")}<button className="btn btn-outline btn-sm">{r.published ? "Unpublish" : "Publish"}</button></ActionForm>
                <ActionForm action={quickUpdateProject}>{h("id", r.id)}{h("field", "featured")}<button className="btn btn-outline btn-sm">{r.featured ? "Unfeature" : "Feature"}</button></ActionForm>
                {!q && !status && !state && (<>
                  <ActionForm action={moveProject}>{h("id", r.id)}{h("dir", "up")}<button className="btn btn-outline btn-sm" disabled={i === 0} aria-label={`Move ${r.title} up`}>&uarr;</button></ActionForm>
                  <ActionForm action={moveProject}>{h("id", r.id)}{h("dir", "down")}<button className="btn btn-outline btn-sm" disabled={i === total - 1} aria-label={`Move ${r.title} down`}>&darr;</button></ActionForm>
                </>)}
                <Link href={`/admin/projects/${r.id}`} className="btn btn-outline btn-sm">Edit</Link>
                <ActionForm action={duplicateProject}>{h("id", r.id)}<button className="btn btn-outline btn-sm">Duplicate</button></ActionForm>
                <ActionForm action={deleteProject}>{h("id", r.id)}<ConfirmButton message={`"${r.title}" and its gallery will be permanently deleted.`}>Delete</ConfirmButton></ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
