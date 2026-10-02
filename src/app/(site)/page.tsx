import { getSiteData, getProject } from "@/lib/content";
import { buildMetadata, siteUrl } from "@/lib/seo";
import { About, CallToAction, Contact, Hero, Services, Spotlight, Testimonials, WhyChoose, Works } from "@/components/site/Sections";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { blocks } = await getSiteData();
  return buildMetadata(blocks, { path: "" });
}

export default async function HomePage() {
  const data = await getSiteData();
  const { blocks } = data;
  const spotlight = data.projects.find((p) => p.featured);
  const detail = spotlight ? await getProject(spotlight.slug) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: blocks.site.name, url: siteUrl(blocks), telephone: blocks.contact.phone || undefined, email: blocks.contact.email || undefined, logo: blocks.site.logo_url || undefined, sameAs: data.socials.map((s) => s.url) },
      { "@type": "WebSite", name: blocks.site.name, url: siteUrl(blocks) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero hero={blocks.hero} slides={data.slides} />
      <About about={blocks.about} />
      <Services services={data.services} headings={blocks.headings} />
      <Works projects={data.projects} categories={data.categories} headings={blocks.headings} />
      {spotlight && <Spotlight project={spotlight} eyebrow={blocks.headings.spotlight_eyebrow} detail={detail ? { services: detail.services_provided, client: detail.client_name, date: detail.project_date } : undefined} />}
      <WhyChoose headings={blocks.headings} />
      <Testimonials items={data.testimonials} headings={blocks.headings} />
      <CallToAction cta={blocks.cta} />
      <Contact contact={blocks.contact} />
    </>
  );
}
