import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getSiteData } from "@/lib/content";
import { buildMetadata, siteUrl } from "@/lib/seo";
import { formatDate, safeHref, telLink, whatsappLink, youtubeEmbed } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/types";
import { Icon, WhatsAppIcon } from "@/components/Icon";
import { ProjectCardView } from "@/components/site/ProjectCardView";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const [project, { blocks }] = await Promise.all([getProject(slug), getSiteData()]);
  if (!project) return { title: "Project not found" };
  return buildMetadata(blocks, {
    title: project.seo_title || `${project.title} | ${blocks.site.name}`,
    description: project.seo_description || project.short_description || blocks.seo.description,
    path: `/work/${project.slug}`, image: project.featured_image_url, type: "article",
  });
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const [project, data] = await Promise.all([getProject(slug), getSiteData()]);
  if (!project) notFound();
  const { blocks } = data;
  const embed = project.video_url ? youtubeEmbed(project.video_url) : null;
  const related = data.projects.filter((p) => p.id !== project.id).sort((a, b) => Number(b.category_id === project.category_id) - Number(a.category_id === project.category_id)).slice(0, 3);
  const facts: [string, string][] = [
    ["Status", STATUS_LABEL[project.status]], ["Category", project.category_name ?? ""], ["Client", project.client_name], ["Location", project.location],
    ["Started", formatDate(project.project_date)], ["Completed", formatDate(project.completion_date)],
  ].filter(([, v]) => v) as [string, string][];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "CreativeWork", name: project.title, description: project.short_description || undefined,
    image: project.featured_image_url || undefined, url: `${siteUrl(blocks)}/work/${project.slug}`, dateModified: project.updated_at,
    creator: { "@type": "Organization", name: blocks.site.name },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="relative isolate flex min-h-[70svh] items-end overflow-hidden bg-[#14110d] text-white">
        {project.featured_image_url && <Image src={project.featured_image_url} alt={project.title} fill priority sizes="100vw" className="-z-10 object-cover" unoptimized={project.featured_image_url.endsWith(".svg")} />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        <div className="container-page pb-14 pt-32">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/75"><Link href="/" className="hover:text-white">Home</Link> / <Link href="/#works" className="hover:text-white">Works</Link></nav>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">{STATUS_LABEL[project.status]}{project.category_name ? ` / ${project.category_name}` : ""}</p>
          <h1 className="max-w-4xl text-[clamp(2.2rem,6vw,5rem)] font-medium leading-[1.05]">{project.title}</h1>
        </div>
      </header>

      <div className="container-page grid gap-14 py-16 sm:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {project.short_description && <p className="font-display text-2xl leading-snug sm:text-3xl">{project.short_description}</p>}
          {project.full_description && <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted">{project.full_description.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>}
          {project.external_url && <a href={safeHref(project.external_url)} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-9">Visit project <Icon name="arrowUpRight" className="h-4 w-4" /><span className="sr-only"> (opens in a new tab)</span></a>}
        </div>
        <aside className="lg:col-span-5" aria-label="Project information">
          <div className="rounded-3xl border-t-4 border-accent bg-surface p-7 shadow-sm ring-1 ring-line">
            <h2 className="text-xl font-medium">Project information</h2>
            <dl className="mt-5 divide-y divide-line text-sm">
              {facts.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
            {project.services_provided.length > 0 && <div className="mt-5"><p className="text-sm text-muted">Services provided</p><ul className="mt-2 flex flex-wrap gap-2">{project.services_provided.map((s) => <li key={s} className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">{s}</li>)}</ul></div>}
            {project.tools_used.length > 0 && <div className="mt-5"><p className="text-sm text-muted">Tools and technologies</p><ul className="mt-2 flex flex-wrap gap-2">{project.tools_used.map((s) => <li key={s} className="rounded-full bg-accent2/10 px-3 py-1 text-sm font-medium text-accent2">{s}</li>)}</ul></div>}
          </div>
        </aside>
      </div>

      {(embed || project.images.length > 0) && (
        <section aria-label="Gallery" className="container-page pb-16 sm:pb-24">
          {embed && <div className="mb-6 aspect-video overflow-hidden rounded-3xl"><iframe src={embed} title={`${project.title} video`} className="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {project.images.map((img, i) => (
              <div key={img.id} className={`relative overflow-hidden rounded-2xl bg-surface ${i % 3 === 0 ? "aspect-[16/10] sm:col-span-2" : "aspect-[4/3]"}`}>
                <Image src={img.url} alt={img.alt || `${project.title}, image ${i + 1}`} fill sizes={i % 3 === 0 ? "100vw" : "50vw"} className="object-cover" unoptimized={img.url.endsWith(".svg")} />
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="bg-gradient-to-b from-accent/[0.07] to-accent2/[0.07] py-16 sm:py-24">
          <div className="container-page">
            <h2 id="related-h" className="h-section mb-10">Related works</h2>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <ProjectCardView key={p.id} project={p} />)}</div>
          </div>
        </section>
      )}

      <section aria-labelledby="pcta-h" className="container-page py-16 text-center sm:py-24">
        <h2 id="pcta-h" className="h-section mx-auto max-w-2xl">{blocks.cta.heading}</h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/#contact" className="btn btn-primary">{blocks.cta.button_label || "Get in touch"}</Link>
          {blocks.contact.phone && <a href={telLink(blocks.contact.phone)} className="btn btn-outline"><Icon name="phone" className="h-4 w-4" /> Call</a>}
          {blocks.contact.whatsapp && <a href={whatsappLink(blocks.contact.whatsapp, `Hello Moses Studio, I would like to talk about ${project.title}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
        </div>
      </section>
    </article>
  );
}
