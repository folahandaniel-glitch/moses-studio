import Image from "next/image";
import Link from "next/link";
import { Icon, WhatsAppIcon } from "../Icon";
import { Reveal } from "./Reveal";
import { Carousel } from "./Carousel";
import { ProjectCardView } from "./ProjectCardView";
import { ContactForm } from "./ContactForm";
import { WorksExplorer } from "./WorksExplorer";
import { safeHref, telLink, whatsappLink, formatDate } from "@/lib/utils";
import { STATUS_LABEL, type Blocks, type Category, type GalleryImage, type ProcessStep, type ProjectCard, type Service, type Slide, type SocialLink, type Testimonial } from "@/lib/types";

const TONES = [
  { chip: "bg-accent/10 text-accent", bar: "bg-accent", num: "bg-accent text-accent-ink", border: "border-accent" },
  { chip: "bg-accent2/10 text-accent2", bar: "bg-accent2", num: "bg-accent2 text-white", border: "border-accent2" },
  { chip: "bg-accent3/10 text-accent3", bar: "bg-accent3", num: "bg-accent3 text-white", border: "border-accent3" },
];

function Heading({ eyebrow, title, intro, center = false }: { eyebrow?: string; title: string; intro?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="h-section">{title}</h2>
      <span className={`mt-5 block h-1 w-16 rounded-full bg-gradient-to-r from-accent via-accent2 to-accent3 ${center ? "mx-auto" : ""}`} />
      {intro && <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>}
    </Reveal>
  );
}

export function Hero({ hero, slides }: { hero: Blocks["hero"]; slides: Slide[] }) {
  return (
    <section id="home" aria-label="Introduction" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[#14110d] text-white">
      {slides.length > 0 ? <Carousel slides={slides} /> : <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent2 to-accent3" />}
      <div className="container-page relative z-10 pb-28 pt-32 sm:pb-36">
        <div className="max-w-4xl">
          {hero.eyebrow && <p className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white"><span className="h-px w-10 bg-accent3" />{hero.eyebrow}</p>}
          <h1 className="text-[clamp(2.4rem,7vw,5.8rem)] font-medium leading-[1.02] tracking-tight">{hero.heading}</h1>
          {hero.subtitle && <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">{hero.subtitle}</p>}
          {hero.description && <p className="mt-3 max-w-2xl text-base text-white/75">{hero.description}</p>}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {hero.primary_label && <a href={safeHref(hero.primary_href)} className="btn btn-primary shadow-lg shadow-black/30">{hero.primary_label} <Icon name="arrow" className="h-4 w-4" /></a>}
            {hero.secondary_label && <a href={safeHref(hero.secondary_href)} className="btn btn-ghost">{hero.secondary_label}</a>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function About({ about }: { about: Blocks["about"] }) {
  const facts = [about.years_experience && { k: "Experience", v: about.years_experience }, about.location && { k: "Based in", v: about.location }].filter(Boolean) as { k: string; v: string }[];
  return (
    <section id="about" aria-labelledby="about-h" className="py-24 sm:py-32">
      <div className="container-page grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-accent/20 via-accent2/15 to-accent3/20 ring-1 ring-accent/20">
            {about.image_url ? (
              <Image src={about.image_url} alt={`${about.heading}: profile`} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" unoptimized={about.image_url.endsWith(".svg")} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted"><span className="font-display text-6xl text-accent">M</span><span className="text-sm">Profile image placeholder. Upload one in the dashboard under About.</span></div>
            )}
          </div>
        </Reveal>
        <div className="lg:col-span-7 lg:pt-6">
          <Reveal>
            {about.eyebrow && <p className="eyebrow mb-4">{about.eyebrow}</p>}
            <h2 id="about-h" className="h-section">{about.heading}</h2>
            {about.introduction && <p className="mt-6 text-xl leading-relaxed">{about.introduction}</p>}
          </Reveal>
          {about.biography && <Reveal delay={80}><div className="mt-6 space-y-4 text-base leading-relaxed text-muted">{about.biography.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div></Reveal>}
          {about.statement && <Reveal delay={120}><blockquote className="mt-8 border-l-4 border-accent3 bg-accent3/5 py-3 pl-5 font-display text-xl italic leading-snug sm:text-2xl">{about.statement}</blockquote></Reveal>}
          {about.capabilities.length > 0 && (
            <Reveal delay={160}>
              <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {about.capabilities.map((c) => <li key={c} className="flex items-start gap-3 text-base"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-accent2" />{c}</li>)}
              </ul>
            </Reveal>
          )}
          {facts.length > 0 && <Reveal delay={180}><dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4 border-t border-line pt-6">{facts.map((f) => <div key={f.k}><dt className="text-xs uppercase tracking-widest text-muted">{f.k}</dt><dd className="mt-1 text-lg font-medium">{f.v}</dd></div>)}</dl></Reveal>}
          {about.cta_label && <Reveal delay={200}><a href={safeHref(about.cta_href)} className="btn btn-primary mt-9">{about.cta_label} <Icon name="arrow" className="h-4 w-4" /></a></Reveal>}
        </div>
      </div>
    </section>
  );
}

export function Services({ services, headings }: { services: Service[]; headings: Blocks["headings"] }) {
  if (!services.length) return null;
  return (
    <section id="services" aria-labelledby="services-h" className="bg-gradient-to-b from-accent/[0.07] to-accent2/[0.07] py-24 sm:py-32">
      <div className="container-page">
        <Heading eyebrow={headings.services_eyebrow} title={headings.services_heading} intro={headings.services_intro} />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <li key={s.id} className="bg-bg">
              <Reveal delay={(i % 3) * 80} className="h-full">
                <div className="flex h-full flex-col p-8 sm:p-10">
                  {s.image_url ? <div className="relative mb-6 aspect-[16/11] overflow-hidden rounded-2xl ring-1 ring-line"><Image src={s.image_url} alt={s.title} fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover transition duration-700 hover:scale-105" unoptimized={s.image_url.endsWith(".svg")} /></div> : <span className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[i % 3].chip}`}><Icon name={s.icon} className="h-6 w-6" /></span>}
                  <h3 className="text-2xl font-medium">{s.title}</h3>
                  <span className={`mt-3 block h-0.5 w-8 rounded-full ${TONES[i % 3].bar}`} />
                  <p className="mt-3 text-muted">{s.short_description}</p>
                  {s.detailed_description && <details className="group mt-4 text-sm"><summary className="cursor-pointer font-semibold text-accent marker:content-none">Learn more</summary><p className="mt-3 leading-relaxed text-muted">{s.detailed_description}</p></details>}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Process({ steps, headings }: { steps: ProcessStep[]; headings: Blocks["headings"] }) {
  if (!steps.length) return null;
  return (
    <section id="process" aria-labelledby="process-h" className="py-24 sm:py-32">
      <div className="container-page">
        <Heading eyebrow={headings.process_eyebrow} title={headings.process_heading} intro={headings.process_intro} />
        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, i) => {
            const tone = TONES[i % 3];
            return (
              <li key={st.id}>
                <Reveal delay={(i % 4) * 90} className="h-full">
                  <div className="group flex h-full flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
                      {st.image_url && <Image src={st.image_url} alt={st.title} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" unoptimized={st.image_url.endsWith(".svg")} />}
                      <span className={`absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-lg ${tone.num}`}>{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <span className={`mt-6 block h-1 w-10 rounded-full ${tone.bar}`} />
                    <h3 className="mt-4 text-2xl font-medium">{st.title}</h3>
                    <p className="mt-2 text-muted">{st.description}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const MOSAIC = ["aspect-[4/5]", "aspect-square", "aspect-[3/2]", "aspect-[4/5]", "aspect-[3/2]", "aspect-square"];

export function Gallery({ images, headings }: { images: GalleryImage[]; headings: Blocks["headings"] }) {
  if (!images.length) return null;
  return (
    <section id="gallery" aria-labelledby="gallery-h" className="bg-gradient-to-b from-accent3/[0.06] to-accent/[0.06] py-24 sm:py-32">
      <div className="container-page">
        <Heading eyebrow={headings.gallery_eyebrow} title={headings.gallery_heading} intro={headings.gallery_intro} />
        <ul className="mt-14 columns-2 gap-4 sm:gap-5 lg:columns-4">
          {images.map((g, i) => (
            <li key={g.id} className="mb-4 break-inside-avoid sm:mb-5">
              <Reveal delay={(i % 4) * 70}>
                <figure className={`group relative overflow-hidden rounded-2xl bg-surface ring-1 ring-line ${MOSAIC[i % MOSAIC.length]}`}>
                  <Image src={g.image_url} alt={g.alt || g.caption} fill sizes="(min-width:1024px) 22vw, 45vw" className="object-cover transition duration-700 group-hover:scale-105" unoptimized={g.image_url.endsWith(".svg")} />
                  {g.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100">{g.caption}</figcaption>}
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Works({ projects, categories, headings }: { projects: ProjectCard[]; categories: Category[]; headings: Blocks["headings"] }) {
  return (
    <section id="works" aria-labelledby="works-h" className="py-24 sm:py-32">
      <div className="container-page">
        <div className="mb-14"><Heading eyebrow={headings.works_eyebrow} title={headings.works_heading} intro={headings.works_intro} /></div>
        {projects.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-12 text-center text-muted">Projects will appear here once they are published.</p> : <WorksExplorer projects={projects} categories={categories} headings={headings} />}
      </div>
    </section>
  );
}

export function Spotlight({ project, eyebrow, detail }: { project: ProjectCard; eyebrow: string; detail?: { services: string[]; client: string; date: string | null } }) {
  return (
    <section aria-label="Selected project" className="bg-gradient-to-br from-footer via-footer to-accent py-24 text-white sm:py-32">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            {project.featured_image_url && <Image src={project.featured_image_url} alt={project.title} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" unoptimized={project.featured_image_url.endsWith(".svg")} />}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{eyebrow}</p>
          <h2 className="h-section">{project.title}</h2>
          {project.short_description && <p className="mt-5 text-lg leading-relaxed opacity-80">{project.short_description}</p>}
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/20 pt-6 text-sm">
            <div><dt className="opacity-60">Status</dt><dd className="mt-1 text-base font-medium">{STATUS_LABEL[project.status]}</dd></div>
            {project.category_name && <div><dt className="opacity-60">Category</dt><dd className="mt-1 text-base font-medium">{project.category_name}</dd></div>}
            {detail?.client && <div><dt className="opacity-60">Client</dt><dd className="mt-1 text-base font-medium">{detail.client}</dd></div>}
            {detail?.date && <div><dt className="opacity-60">Date</dt><dd className="mt-1 text-base font-medium">{formatDate(detail.date)}</dd></div>}
          </dl>
          <Link href={`/work/${project.slug}`} className="btn mt-9 bg-white text-ink hover:bg-white/90">Explore this project <Icon name="arrow" className="h-4 w-4" /></Link>
        </Reveal>
      </div>
    </section>
  );
}

export function WhyChoose({ headings }: { headings: Blocks["headings"] }) {
  if (!headings.why_items.length) return null;
  return (
    <section aria-labelledby="why-h" className="py-24 sm:py-32">
      <div className="container-page">
        <Heading eyebrow={headings.why_eyebrow} title={headings.why_heading} />
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {headings.why_items.map((it, i) => (
            <li key={i}><Reveal delay={(i % 3) * 80}><div className={`border-t-2 pt-6 ${TONES[i % 3].border}`}><span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${TONES[i % 3].num}`}>{String(i + 1).padStart(2, "0")}</span><h3 className="mt-3 text-2xl font-medium">{it.title}</h3><p className="mt-3 text-muted">{it.text}</p></div></Reveal></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Testimonials({ items, headings }: { items: Testimonial[]; headings: Blocks["headings"] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="t-h" className="bg-gradient-to-b from-accent2/[0.08] to-accent3/[0.08] py-24 sm:py-32">
      <div className="container-page">
        <Heading eyebrow={headings.testimonials_eyebrow} title={headings.testimonials_heading} />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 80}>
              <figure className={`flex h-full flex-col rounded-3xl border-t-4 bg-bg p-8 shadow-sm ring-1 ring-line ${TONES[i % 3].border}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[i % 3].chip}`}><Icon name="quote" className="h-6 w-6" /></span>
                <blockquote className="mt-5 flex-1 text-lg leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  {t.avatar_url && <Image src={t.avatar_url} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />}
                  <span><span className="block font-semibold">{t.author_name}</span>{t.author_role && <span className="block text-sm text-muted">{t.author_role}</span>}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CallToAction({ cta }: { cta: Blocks["cta"] }) {
  return (
    <section aria-labelledby="cta-h" className="px-5 py-8 sm:px-8 lg:px-12">
      <Reveal>
        <div className="mx-auto max-w-page rounded-[2rem] bg-gradient-to-br from-accent via-accent2 to-accent3 px-6 py-16 text-center text-white shadow-xl shadow-accent/20 sm:px-12 sm:py-24">
          <h2 id="cta-h" className="mx-auto max-w-3xl text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.05]">{cta.heading}</h2>
          {cta.description && <p className="mx-auto mt-5 max-w-xl text-lg opacity-90">{cta.description}</p>}
          {cta.button_label && <a href={safeHref(cta.button_href)} className="btn mt-9 bg-white text-ink shadow-lg hover:bg-white/90">{cta.button_label} <Icon name="arrow" className="h-4 w-4" /></a>}
        </div>
      </Reveal>
    </section>
  );
}

export function Contact({ contact }: { contact: Blocks["contact"] }) {
  const items = [
    contact.email && { icon: "mail", label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.address && { icon: "pin", label: "Address", value: contact.address },
    contact.hours && { icon: "clock", label: "Hours", value: contact.hours },
  ].filter(Boolean) as { icon: string; label: string; value: string; href?: string }[];
  return (
    <section id="contact" aria-labelledby="contact-h" className="py-24 sm:py-32">
      <div className="container-page grid gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <Heading eyebrow={contact.eyebrow} title={contact.heading} intro={contact.description} />
          <Reveal delay={100}>
            <div className="mt-10 space-y-3">
              {contact.phone && <a href={telLink(contact.phone)} className="flex items-center gap-4 rounded-2xl border border-line p-5 transition hover:border-ink"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon name="phone" /></span><span><span className="block text-xs uppercase tracking-widest text-muted">Call</span><span className="text-lg font-medium">{contact.phone}</span></span></a>}
              {contact.whatsapp && <a href={whatsappLink(contact.whatsapp, contact.whatsapp_message)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-line p-5 transition hover:border-ink"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C4B]"><WhatsAppIcon /></span><span><span className="block text-xs uppercase tracking-widest text-muted">WhatsApp</span><span className="text-lg font-medium">{contact.whatsapp}</span><span className="sr-only"> (opens in a new tab)</span></span></a>}
              {items.map((it) => { const inner = (<><span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent3/10 text-accent3"><Icon name={it.icon} /></span><span><span className="block text-xs uppercase tracking-widest text-muted">{it.label}</span><span className="text-lg font-medium">{it.value}</span></span></>); return it.href ? <a key={it.label} href={it.href} className="flex items-center gap-4 rounded-2xl border border-line p-5 transition hover:border-ink">{inner}</a> : <div key={it.label} className="flex items-center gap-4 rounded-2xl border border-line p-5">{inner}</div>; })}
            </div>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-7" delay={80}>
          <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] to-accent2/[0.06] p-6 sm:p-10"><ContactForm /></div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ name, tagline, footer, socials, nav }: { name: string; tagline: string; footer: Blocks["footer"]; socials: SocialLink[]; nav: { id: string; label: string; href: string }[] }) {
  return (
    <footer className="bg-footer text-white">
      <div className="h-1 bg-gradient-to-r from-accent via-accent2 to-accent3" />
      <div className="container-page pb-24 pt-14 sm:pb-20">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div>
            <p className="font-display text-3xl font-medium">{name}</p>
            {tagline && <p className="mt-2 text-sm text-white/70">{tagline}</p>}
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">{nav.map((n) => <a key={n.id} href={n.href.startsWith("#") ? `/${n.href}` : n.href} className="text-white/80 transition hover:text-white">{n.label}</a>)}</nav>
          {socials.length > 0 && <ul className="flex flex-wrap gap-3" aria-label="Social media">{socials.map((s) => <li key={s.id}><a href={safeHref(s.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-sm font-medium transition hover:border-white hover:bg-white/10">{s.network}<Icon name="arrowUpRight" className="h-3.5 w-3.5" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/70 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {footer.text}</p>
          <div className="flex flex-col sm:items-end">
            {footer.credit && <p>{footer.credit}</p>}
            {footer.backend_label && <a href="/admin/login" rel="nofollow" className="mt-1 text-[10px] tracking-widest text-white/40 transition hover:text-white/90">{footer.backend_label}</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}

export { ProjectCardView };
