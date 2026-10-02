"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../Icon";
import { cn } from "@/lib/utils";

interface Slide { id: string; image_url: string; alt: string; caption: string }

export function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || !playing || hover || reduced) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(t);
  }, [count, playing, hover, reduced]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0" role="region" aria-roledescription="carousel" aria-label="Featured imagery" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {slides.map((s, i) => (
        <div key={s.id} className={cn("absolute inset-0 transition-opacity duration-1000", i === index ? "opacity-100" : "opacity-0")} aria-hidden={i !== index} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
          <Image src={s.image_url} alt={s.alt} fill sizes="100vw" priority={i === 0} loading={i === 0 ? "eager" : "lazy"} quality={80} className={cn("object-cover", i === index && !reduced && "kenburns")} unoptimized={s.image_url.endsWith(".svg")} />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/45" />
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-10 sm:bottom-8">
          <div className="container-page flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/15"><Icon name="left" className="h-4 w-4" /></button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/15"><Icon name="right" className="h-4 w-4" /></button>
              <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/15"><Icon name={playing ? "pause" : "play"} className="h-4 w-4" /></button>
            </div>
            <p className="hidden truncate text-sm text-white/80 sm:block" aria-live="polite">{slides[index].caption}</p>
            <div className="flex items-center gap-1" role="tablist" aria-label="Choose slide">
              {slides.map((s, i) => (
                <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={`Go to slide ${i + 1}`} onClick={() => go(i)} className="flex h-8 w-6 items-center justify-center">
                  <span className={cn("block h-0.5 transition-all", i === index ? "w-6 bg-white" : "w-3 bg-white/50")} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
