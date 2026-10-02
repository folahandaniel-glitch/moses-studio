"use client";
import { useMemo, useState } from "react";
import { ProjectCardView } from "./ProjectCardView";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import type { Category, HeadingsBlock, ProjectCard, ProjectStatus } from "@/lib/types";

const PAGE_SIZE = 6;
const GROUP_STYLE: Record<ProjectStatus, { border: string; dot: string }> = {
  PRECIOUS: { border: "border-precious", dot: "bg-precious" },
  ONGOING: { border: "border-ongoing", dot: "bg-ongoing" },
  READY: { border: "border-ready", dot: "bg-ready" },
};

export function WorksExplorer({ projects, categories, headings }: { projects: ProjectCard[]; categories: Category[]; headings: HeadingsBlock }) {
  const [active, setActive] = useState<string>("all");
  const [limits, setLimits] = useState<Record<ProjectStatus, number>>({ PRECIOUS: PAGE_SIZE, ONGOING: PAGE_SIZE, READY: PAGE_SIZE });

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    projects.forEach((p) => p.category_slug && m.set(p.category_slug, (m.get(p.category_slug) ?? 0) + 1));
    return m;
  }, [projects]);
  const visibleCategories = categories.filter((c) => counts.has(c.slug));
  const filtered = active === "all" ? projects : projects.filter((p) => p.category_slug === active);

  const groups: { status: ProjectStatus; title: string; intro: string }[] = [
    { status: "PRECIOUS", title: headings.precious_title, intro: headings.precious_intro },
    { status: "ONGOING", title: headings.ongoing_title, intro: headings.ongoing_intro },
    { status: "READY", title: headings.ready_title, intro: headings.ready_intro },
  ];

  const select = (slug: string) => {
    setActive(slug);
    setLimits({ PRECIOUS: PAGE_SIZE, ONGOING: PAGE_SIZE, READY: PAGE_SIZE });
  };

  return (
    <div>
      {visibleCategories.length > 0 && (
        <div className="mb-14 sm:mb-20" role="group" aria-label={headings.categories_heading}>
          <p className="mb-4 text-sm font-medium text-muted">{headings.categories_heading}</p>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ slug: "all", name: "All works", n: projects.length }, ...visibleCategories.map((c) => ({ slug: c.slug, name: c.name, n: counts.get(c.slug) ?? 0 }))].map((c) => (
              <button key={c.slug} type="button" onClick={() => select(c.slug)} aria-pressed={active === c.slug}
                className={cn("shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition", active === c.slug ? "border-accent bg-accent text-accent-ink shadow-md shadow-accent/25" : "border-line hover:border-accent hover:text-accent")}>
                {c.name} <span className={cn("ml-1 text-xs", active === c.slug ? "opacity-70" : "text-muted")}>{c.n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div aria-live="polite" className="space-y-20 sm:space-y-28">
        {groups.map((g) => {
          const items = filtered.filter((p) => p.status === g.status);
          if (items.length === 0) return null;
          const shown = items.slice(0, limits[g.status]);
          return (
            <section key={g.status} id={g.status.toLowerCase()} aria-labelledby={`h-${g.status}`}>
              <Reveal>
                <div className={cn("mb-8 flex flex-col justify-between gap-2 border-b-2 pb-5 sm:flex-row sm:items-end", GROUP_STYLE[g.status].border)}>
                  <h3 id={`h-${g.status}`} className="flex items-center gap-3 text-2xl font-medium sm:text-3xl"><span className={cn("h-3 w-3 rounded-full", GROUP_STYLE[g.status].dot)} aria-hidden="true" />{g.title}</h3>
                  <p className="max-w-md text-sm text-muted sm:text-right">{g.intro}</p>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 80} className={cn(g.status === "PRECIOUS" && p.featured && i === 0 && "sm:col-span-2")}>
                    <ProjectCardView project={p} large={g.status === "PRECIOUS" && p.featured && i === 0} />
                  </Reveal>
                ))}
              </div>
              {items.length > shown.length && (
                <div className="mt-12 text-center">
                  <button type="button" className="btn btn-outline" onClick={() => setLimits((l) => ({ ...l, [g.status]: l[g.status] + PAGE_SIZE }))}>
                    Show more ({items.length - shown.length} remaining)
                  </button>
                </div>
              )}
            </section>
          );
        })}
        {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">No projects in this category yet.</p>}
      </div>
    </div>
  );
}
