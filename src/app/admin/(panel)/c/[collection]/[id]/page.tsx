import { ActionForm } from "@/components/admin/ActionForm";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { COLLECTIONS } from "@/lib/collections";
import { FieldInput } from "@/components/admin/Fields";
import { PageHeader, first, type SearchParams } from "@/components/admin/UI";
import { saveCollectionItem } from "../../../../actions";
import Link from "next/link";

export default async function CollectionEditPage({ params, searchParams }: { params: Promise<{ collection: string; id: string }>; searchParams: SearchParams }) {
  const { collection, id } = await params;
  const def = COLLECTIONS[collection];
  if (!def) notFound();
  const sp = await searchParams;
  let row: Record<string, unknown> = {};
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const [found] = await sql<Record<string, unknown>[]>`select * from ${sql(def.table)} where id = ${id}`;
    if (!found) notFound();
    row = found;
  }
  return (
    <>
      <PageHeader title={id === "new" ? `Add ${def.singular}` : `Edit ${def.singular}`} description={def.description} sp={{ notice: first(sp.notice), error: first(sp.error) }} />
      <ActionForm action={saveCollectionItem} className="admin-card space-y-6">
        <input type="hidden" name="collection" value={collection} />
        <input type="hidden" name="id" value={id === "new" ? "" : id} />
        {def.fields.map((f) => <FieldInput key={f.name} field={f} value={id === "new" && f.type === "boolean" ? true : row[f.name]} />)}
        <div className="flex justify-end gap-3 border-t border-line pt-5"><Link href={`/admin/c/${collection}`} className="btn btn-outline">Cancel</Link><button type="submit" className="btn btn-primary">Save</button></div>
      </ActionForm>
    </>
  );
}
