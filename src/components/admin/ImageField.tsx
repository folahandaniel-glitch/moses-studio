"use client";
import { useRef, useState } from "react";
import Image from "next/image";

interface MediaItem { id: string; url: string; filename: string }

/** Upload an image (or pick one from the library) and store its URL in a hidden form field. */
export function ImageField({ name, label, defaultValue = "", help, compact = false }: { name: string; label: string; defaultValue?: string; help?: string; compact?: boolean }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [library, setLibrary] = useState<MediaItem[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true); setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      setUrl(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Check your connection.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function openLibrary() {
    if (library) return setLibrary(null);
    try {
      const res = await fetch("/api/admin/media");
      setLibrary((await res.json()).items ?? []);
    } catch { setError("Could not load the media library."); }
  }

  return (
    <div>
      <span className="admin-label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-start gap-4">
        <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-bg ${compact ? "h-20 w-28" : "h-32 w-44"}`}>
          {url ? <Image src={url} alt="" fill sizes="176px" className="object-cover" unoptimized /> : <span className="px-2 text-center text-xs text-muted">No image</span>}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading..." : url ? "Replace image" : "Upload image"}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={openLibrary}>{library ? "Close library" : "Choose from library"}</button>
            {url && <button type="button" className="btn btn-danger btn-sm" onClick={() => setUrl("")}>Remove</button>}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" aria-label={`Upload ${label}`} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {help && <p className="max-w-sm text-xs text-muted">{help}</p>}
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </div>
      {library && (
        <div className="mt-3 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-line bg-bg p-2 sm:grid-cols-5">
          {library.length === 0 && <p className="col-span-full p-4 text-center text-sm text-muted">The library is empty. Upload an image first.</p>}
          {library.map((m) => (
            <button key={m.id} type="button" onClick={() => { setUrl(m.url); setLibrary(null); }} className="relative aspect-square overflow-hidden rounded-lg border border-line hover:border-accent" aria-label={`Use ${m.filename}`}>
              <Image src={m.url} alt="" fill sizes="120px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
