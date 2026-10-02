import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { Sidebar, type NavGroup } from "@/components/admin/Sidebar";
import { COLLECTIONS } from "@/lib/collections";
import { SECTIONS } from "@/lib/sections";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Admin | Moses Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [{ unread }] = await sql<{ unread: number }[]>`select count(*)::int as unread from ms_contact_submissions where not is_read`;
  const groups: NavGroup[] = [
    { heading: "Overview", items: [{ href: "/admin", label: "Dashboard" }] },
    { heading: "Portfolio", items: [{ href: "/admin/projects", label: "Portfolio" }, { href: "/admin/c/categories", label: COLLECTIONS.categories.title }, { href: "/admin/media", label: "Media Library" }] },
    { heading: "Website", items: [
      { href: "/admin/content/site", label: SECTIONS.site.title }, { href: "/admin/content/theme", label: SECTIONS.theme.title },
      { href: "/admin/c/navigation", label: COLLECTIONS.navigation.title }, { href: "/admin/c/hero_slides", label: COLLECTIONS.hero_slides.title },
      { href: "/admin/content/hero", label: "Hero" }, { href: "/admin/content/about", label: "About" }, { href: "/admin/c/services", label: "Services" },
      { href: "/admin/content/headings", label: "Section Headings" }, { href: "/admin/c/testimonials", label: "Testimonials" }, { href: "/admin/content/cta", label: "Call To Action" },
      { href: "/admin/content/contact", label: "Contact" }, { href: "/admin/c/social_links", label: "Social Links" }, { href: "/admin/content/footer", label: "Footer" }, { href: "/admin/content/seo", label: "SEO" },
    ] },
    { heading: "Inbox", items: [{ href: "/admin/messages", label: "Enquiries", badge: unread }] },
    { heading: "Account", items: [
      ...(admin.role === "SUPER_ADMIN" ? [{ href: "/admin/users", label: "Users" }] : []),
      { href: "/admin/security", label: "Security" }, { href: "/admin/activity", label: "Activity Log" },
    ] },
  ];
  return (
    <div className="admin-root min-h-[100svh]">
      <Sidebar groups={groups} userName={admin.name} role={admin.role} logoutAction={logout} />
      <div className="lg:pl-64"><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">{children}</div></div>
    </div>
  );
}
