import { ActionForm } from "@/components/admin/ActionForm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { COLLECTIONS } from "@/lib/collections";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Empty, PageHeader, PublishBadge, first, type SearchParams } from "@/components/admin/UI";
import { deleteCollectionItem, moveCollectionItem, toggleCollectionVisibility } from "../../../actions";

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: SearchParams }) {
  const { collection } = await params;
  const def = COLLECTIONS[collection];
  if (!def) notFound();
  const sp = await searchParams;
  const rows = await sql<Record<string, string | boolean>[]>`select * from ${sql(def.table)} order by sort_order, ${sql(def.titleField)}`;
  return (
    <>
      <PageHeader title={def.title} description={def.description} sp={{ notice: first(sp.notice), error: first(sp.error) }}
        action={<Link href={`/admin/c/${collection}/new`} className="btn btn-primary btn-sm">Add {def.singular}</Link>} />
      {rows.length === 0 ? <Empty title={`No ${def.title.toLowerCase()} yet`} text={`Add your first ${def.singular}.`} href={`/admin/c/${collection}/new`} cta={`Add ${def.singular}`} /> : (
        <ul className="admin-card divide-y divide-line !p-0">
          {rows.map((r, i) => {
            const id = String(r.id);
            const vis = def.visibilityField ? Boolean(r[def.visibilityField]) : true;
            const hidden = (k: string, v: string) => <input type="hidden" name={k} value={v} />;
            return (
              <li key={id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                {def.imageField && (<div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-bg">{r[def.imageField] ? <Image src={String(r[def.imageField])} alt="" fill sizes="80px" className="object-cover" unoptimized /> : null}</div>)}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{String(r[def.titleField] || "Untitled")}</p>
                  {def.subtitleField && <p className="line-clamp-1 text-sm text-muted">{String(r[def.subtitleField] ?? "")}</p>}
                </div>
                {def.visibilityField && <PublishBadge published={vis} on="Visible" off="Hidden" />}
                <div className="flex flex-wrap items-center gap-2">
                  {def.sortable && (<>
                    <ActionForm action={moveCollectionItem}>{hidden("collection", collection)}{hidden("id", id)}{hidden("dir", "up")}<button className="btn btn-outline btn-sm" disabled={i === 0} aria-label={`Move ${String(r[def.titleField])} up`}>&uarr;</button></ActionForm>
                    <ActionForm action={moveCollectionItem}>{hidden("collection", collection)}{hidden("id", id)}{hidden("dir", "down")}<button className="btn btn-outline btn-sm" disabled={i === rows.length - 1} aria-label={`Move ${String(r[def.titleField])} down`}>&darr;</button></ActionForm>
                  </>)}
                  {def.visibilityField && <ActionForm action={toggleCollectionVisibility}>{hidden("collection", collection)}{hidden("id", id)}<button className="btn btn-outline btn-sm">{vis ? "Hide" : "Show"}</button></ActionForm>}
                  <Link href={`/admin/c/${collection}/${id}`} className="btn btn-outline btn-sm">Edit</Link>
                  <ActionForm action={deleteCollectionItem}>{hidden("collection", collection)}{hidden("id", id)}<ConfirmButton message={`This ${def.singular} will be permanently removed from the website.`}>Delete</ConfirmButton></ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
