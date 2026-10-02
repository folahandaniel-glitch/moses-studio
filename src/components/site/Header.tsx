"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  logoUrl: string;
  nav: { id: string; label: string; href: string }[];
  ctaLabel: string;
  ctaHref: string;
  overHero: boolean;
}

export function Header({ name, logoUrl, nav, ctaLabel, ctaHref, overHero }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const solid = scrolled || open || !overHero;
  const href = (h: string) => (h.startsWith("#") && !overHero ? `/${h}` : h);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-40 transition-all duration-300", solid ? "border-b border-line bg-bg/90 text-ink backdrop-blur-md" : "text-white")}>
      <div className="container-page flex h-16 items-center justify-between sm:h-[72px]">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight" aria-label={`${name} home`}>
          {logoUrl ? <Image src={logoUrl} alt={name} width={160} height={40} className="h-9 w-auto object-contain" priority unoptimized={logoUrl.endsWith(".svg")} /> : name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <a key={n.id} href={href(n.href)} className="text-sm font-medium opacity-80 transition hover:opacity-100">{n.label}</a>
          ))}
          {ctaLabel && <a href={href(ctaHref)} className={cn("btn !min-h-[40px] !px-5", solid ? "btn-primary" : "bg-white text-black hover:bg-white/90")}>{ctaLabel}</a>}
        </nav>
        <button type="button" className="-mr-2 flex h-11 w-11 items-center justify-center md:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="fixed inset-x-0 top-16 h-[calc(100dvh-4rem)] overflow-y-auto bg-bg px-5 pb-10 pt-6 text-ink md:hidden">
          <ul className="divide-y divide-line">
            {nav.map((n) => (
              <li key={n.id}><a href={href(n.href)} onClick={() => setOpen(false)} className="block py-5 font-display text-3xl">{n.label}</a></li>
            ))}
          </ul>
          {ctaLabel && <a href={href(ctaHref)} onClick={() => setOpen(false)} className="btn btn-primary mt-8 w-full">{ctaLabel}</a>}
        </nav>
      )}
    </header>
  );
}
