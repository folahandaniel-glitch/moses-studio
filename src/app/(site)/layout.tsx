import { getSiteData } from "@/lib/content";
import { themeVars, whatsappLink } from "@/lib/utils";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Sections";
import { WhatsAppIcon } from "@/components/Icon";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { blocks, navigation, socials } = await getSiteData();
  const { site, theme, contact, hero } = blocks;
  const heading = theme.heading_font === "sans" ? "var(--font-sans)" : "var(--font-serif)";
  const path = (await headers()).get("x-pathname") ?? "/";
  const style = { ...themeVars(theme), "--font-display": heading } as React.CSSProperties;

  return (
    <div style={style} className={theme.mode === "dark" ? "dark-mode bg-bg text-ink" : "bg-bg text-ink"}>
      <a href="#main" className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <Header name={site.name} logoUrl={site.logo_url} nav={navigation} ctaLabel={hero.secondary_label} ctaHref={hero.secondary_href} overHero={path === "/"} />
      <main id="main">{children}</main>
      <Footer name={site.name} tagline={site.tagline} footer={blocks.footer} socials={socials} nav={navigation} />
      {contact.whatsapp && (
        <a href={whatsappLink(contact.whatsapp, contact.whatsapp_message)} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp (opens in a new tab)"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105">
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
