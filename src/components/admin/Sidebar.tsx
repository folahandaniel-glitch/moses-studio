"use client";
import { ActionForm } from "@/components/admin/ActionForm";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "../Icon";
import { cn } from "@/lib/utils";

export interface NavGroup { heading: string; items: { href: string; label: string; badge?: number }[] }

export function Sidebar({ groups, userName, role, logoutAction }: { groups: NavGroup[]; userName: string; role: string; logoutAction: () => Promise<unknown> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6"><p className="font-semibold tracking-tight">Moses Studio</p><p className="text-xs opacity-60">Admin dashboard</p></div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.heading} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest opacity-50">{g.heading}</p>
            <ul>{g.items.map((it) => (
              <li key={it.href}><Link href={it.href} onClick={() => setOpen(false)} aria-current={active(it.href) ? "page" : undefined}
                className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm transition", active(it.href) ? "bg-white/12 font-semibold" : "opacity-80 hover:bg-white/8 hover:opacity-100")}>
                {it.label}{!!it.badge && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink">{it.badge}</span>}
              </Link></li>
            ))}</ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-sm">
        <p className="truncate font-semibold">{userName}</p>
        <p className="text-xs opacity-60">{role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</p>
        <div className="mt-3 flex gap-2">
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm flex-1">View site</Link>
          <ActionForm action={logoutAction}><button type="submit" className="btn btn-ghost btn-sm">Sign out</button></ActionForm>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#16130F] px-4 text-white lg:hidden">
        <p className="font-semibold">Moses Studio Admin</p>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="admin-drawer" aria-label={open ? "Close menu" : "Open menu"} className="flex h-11 w-11 items-center justify-center"><Icon name={open ? "close" : "menu"} /></button>
      </div>
      {open && <div id="admin-drawer" className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto bg-[#16130F] text-white lg:hidden">{content}</div>}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[#16130F] text-white lg:block">{content}</aside>
    </>
  );
}
