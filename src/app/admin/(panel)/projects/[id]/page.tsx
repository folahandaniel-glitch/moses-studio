import { ActionForm } from "@/components/admin/ActionForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { PROJECT_STATUSES, STATUS_LABEL } from "@/lib/types";
import { ImageField } from "@/components/admin/ImageField";
import { GalleryField } from "@/components/admin/RepeaterFields";
import { PageHeader, first, type SearchParams } from "@/components/admin/UI";
import { saveProject } from "../../../actions";

interface Project {
  id: string; title: string; slug: string; short_description: string; full_description: string; category_id: string | null; status: string;
  featured_image_url: string; video_url: string; client_name: string; location: string; project_date: string | null; completion_date: string | null;
  services_provided: string[]; tools_used: string[]; external_url: string; sort_order: number; featured: boolean; published: boolean; seo_title: string; seo_description: string;
}

const blank: Project = { id: "", title: "", slug: "", short_description: "", full_description: "", category_id: null, status: "READY", featured_image_url: "", video_url: "", client_name: "", location: "", project_date: null, completion_date: null, services_provided: [], tools_used: [], external_url: "", sort_order: 0, featured: false, published: false, seo_title: "", seo_description: "" };

const Text = ({ name, label, value, help, type = "text", max = 200 }: { name: string; label: string; value: string | number; help?: string; type?: string; max?: number }) => (
  <div><label htmlFor={name} className="admin-label">{label}</label><input id={name} name={name} type={type} defaultValue={value} maxLength={max} className="field" />{help && <p className="mt-1.5 text-xs text-muted">{help}</p>}</div>
);

export default async function ProjectEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  let project = blank;
  let gallery: { url: string; alt: string }[] = [];
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const [row] = await sql<Project[]>`select id, title, slug, short_description, full_description, category_id, status, featured_image_url, video_url, client_name, location,
      project_date::text, completion_date::text, services_provided, tools_used, external_url, sort_order, featured, published, seo_title, seo_description from projects where id = ${id}`;
    if (!row) notFound();
    project = row;
    gallery = await sql<{ url: string; alt: string }[]>`select url, alt from project_images where project_id = ${id} order by sort_order`;
  }
  const categories = await sql<{ id: string; name: string }[]>`select id, name from categories order by sort_order, name`;
  const isNew = id === "new";
  const section = (title: string, children: React.ReactNode) => <section className="admin-card space-y-5"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>;

  return (
    <>
      <PageHeader title={isNew ? "Add project" : "Edit project"} description={isNew ? "Fill in the essentials. You can save as a draft and publish later." : project.title} sp={{ notice: first(sp.notice), error: first(sp.error) }}
        action={!isNew && project.published ? <Link href={`/work/${project.slug}`} target="_blank" className="btn btn-outline btn-sm">View on website</Link> : undefined} />
      <ActionForm action={saveProject} className="space-y-6">
        <input type="hidden" name="id" value={isNew ? "" : id} />
        {section("Basics", <>
          <Text name="title" label="Project title" value={project.title} max={160} />
          <Text name="slug" label="Web address (slug)" value={project.slug} help="Leave empty to create it from the title. It becomes /work/your-slug." max={100} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="status" className="admin-label">Project status</label><select id="status" name="status" defaultValue={project.status} className="field">{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
            <div><label htmlFor="category_id" className="admin-label">Category</label><select id="category_id" name="category_id" defaultValue={project.category_id ?? ""} className="field"><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div><label htmlFor="short_description" className="admin-label">Short description</label><textarea id="short_description" name="short_description" rows={2} maxLength={400} defaultValue={project.short_description} className="field" /><p className="mt-1.5 text-xs text-muted">Shown on project cards.</p></div>
          <div><label htmlFor="full_description" className="admin-label">Full description</label><textarea id="full_description" name="full_description" rows={8} maxLength={10000} defaultValue={project.full_description} className="field" /><p className="mt-1.5 text-xs text-muted">Separate paragraphs with a blank line.</p></div>
        </>)}
        {section("Images and video", <>
          <ImageField name="featured_image_url" label="Featured image" defaultValue={project.featured_image_url} help="The main image. Use a high quality image at least 1600 pixels wide." />
          <Text name="video_url" label="Video link" value={project.video_url} help="Optional YouTube or Vimeo address." max={500} />
          <div><p className="admin-label">Gallery</p><GalleryField defaultValue={gallery} /></div>
        </>)}
        {section("Details", <>
          <div className="grid gap-5 sm:grid-cols-2"><Text name="client_name" label="Client name" value={project.client_name} help="Only add real client names, with permission." /><Text name="location" label="Location" value={project.location} /></div>
          <div className="grid gap-5 sm:grid-cols-2"><Text name="project_date" label="Project date" value={project.project_date ?? ""} type="date" /><Text name="completion_date" label="Completion date" value={project.completion_date ?? ""} type="date" /></div>
          <Text name="services_provided" label="Services provided" value={project.services_provided.join(", ")} help="Separate with commas." max={500} />
          <Text name="tools_used" label="Tools and technologies" value={project.tools_used.join(", ")} help="Separate with commas." max={500} />
          <Text name="external_url" label="External project link" value={project.external_url} help="Optional https:// address." max={500} />
        </>)}
        {section("Display", <>
          <Text name="sort_order" label="Display order" value={project.sort_order} type="number" help="Lower numbers appear first. You can also reorder from the portfolio list." />
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="featured" defaultChecked={project.featured} className="h-5 w-5 accent-[rgb(var(--c-accent))]" />Featured project (shown larger and in the spotlight section)</label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={project.published} className="h-5 w-5 accent-[rgb(var(--c-accent))]" />Published (visible on the website)</label>
        </>)}
        {section("Search engines", <>
          <Text name="seo_title" label="SEO title" value={project.seo_title} help="Optional. Defaults to the project title." max={160} />
          <div><label htmlFor="seo_description" className="admin-label">SEO description</label><textarea id="seo_description" name="seo_description" rows={2} maxLength={320} defaultValue={project.seo_description} className="field" /></div>
        </>)}
        <div className="sticky bottom-0 z-10 -mx-5 flex justify-end gap-3 border-t border-line bg-bg/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8"><Link href="/admin/projects" className="btn btn-outline">Back to list</Link><button type="submit" className="btn btn-primary">Save project</button></div>
      </ActionForm>
    </>
  );
}
