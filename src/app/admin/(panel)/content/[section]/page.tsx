import { ActionForm } from "@/components/admin/ActionForm";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { SECTIONS } from "@/lib/sections";
import { FieldInput } from "@/components/admin/Fields";
import { PageHeader, first, type SearchParams } from "@/components/admin/UI";
import { saveBlock } from "../../../actions";

export default async function ContentPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: SearchParams }) {
  const { section } = await params;
  const def = SECTIONS[section];
  if (!def) notFound();
  const sp = await searchParams;
  const [row] = await sql<{ data: Record<string, unknown> }[]>`select data from content_blocks where section = ${section}`;
  const data = row?.data ?? {};
  return (
    <>
      <PageHeader title={def.title} description={def.description} sp={{ notice: first(sp.notice), error: first(sp.error) }} />
      <ActionForm action={saveBlock} className="admin-card space-y-6">
        <input type="hidden" name="section" value={section} />
        {def.fields.map((f) => <FieldInput key={f.name} field={f} value={data[f.name]} />)}
        <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end border-t border-line bg-surface/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6"><button type="submit" className="btn btn-primary">Save changes</button></div>
      </ActionForm>
    </>
  );
}
