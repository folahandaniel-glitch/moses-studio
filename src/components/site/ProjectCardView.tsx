import Image from "next/image";
import Link from "next/link";
import { Icon } from "../Icon";
import { STATUS_SHORT, type ProjectCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const BADGE: Record<ProjectCard["status"], string> = { PRECIOUS: "bg-precious", ONGOING: "bg-ongoing", READY: "bg-ready" };

export function ProjectCardView({ project, large = false, priority = false }: { project: ProjectCard; large?: boolean; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col">
      <Link href={`/work/${project.slug}`} className="relative block overflow-hidden rounded-2xl bg-surface ring-1 ring-line transition duration-300 group-hover:ring-2 group-hover:ring-accent/50" aria-label={`View project: ${project.title}`}>
        <div className={cn("relative w-full", large ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-[4/5]")}>
          {project.featured_image_url ? (
            <Image src={project.featured_image_url} alt={`${project.title}${project.category_name ? `, ${project.category_name}` : ""}`} fill sizes={large ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"} priority={priority} className="object-cover object-[50%_30%] transition duration-700 ease-out group-hover:scale-[1.04]" unoptimized={project.featured_image_url.endsWith(".svg")} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No image yet</div>
          )}
          <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow", BADGE[project.status])}>{STATUS_SHORT[project.status]}</span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        {project.category_name && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{project.category_name}</p>}
        <h3 className="mt-1.5 text-xl font-medium leading-snug sm:text-2xl">{project.title}</h3>
        {project.short_description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{project.short_description}</p>}
        <Link href={`/work/${project.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
          View project <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
