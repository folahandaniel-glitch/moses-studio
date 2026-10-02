import { ActionForm } from "@/components/admin/ActionForm";
import Image from "next/image";
import { sql } from "@/lib/db";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Empty, PageHeader, first, type SearchParams } from "@/components/admin/UI";
import { UploadButton } from "@/components/admin/UploadButton";
import { deleteMedia } from "../../actions";

export default async function MediaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const items = await sql<{ id: string; url: string; filename: string; size_bytes: number; width: number | null; height: number | null }[]>`select id, url, filename, size_bytes, width, height from media order by created_at desc limit 200`;
  return (
    <>
      <PageHeader title="Media Library" description="Every image you upload. Images are optimised automatically (resized and converted to WebP)." sp={{ notice: first(sp.notice), error: first(sp.error) }} action={<UploadButton />} />
      {items.length === 0 ? <Empty title="No images yet" text="Upload images here or from any image field in the dashboard." /> : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="admin-card overflow-hidden !p-0">
              <div className="relative aspect-square bg-bg"><Image src={m.url} alt={m.filename} fill sizes="240px" className="object-cover" unoptimized /></div>
              <div className="p-3 text-xs"><p className="truncate font-semibold">{m.filename}</p><p className="text-muted">{m.width}x{m.height} &middot; {Math.round(m.size_bytes / 1024)} KB</p>
                <ActionForm action={deleteMedia} className="mt-2"><input type="hidden" name="id" value={m.id} /><ConfirmButton message="This image file will be permanently deleted. Any page using it will show a missing image.">Delete</ConfirmButton></ActionForm></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
