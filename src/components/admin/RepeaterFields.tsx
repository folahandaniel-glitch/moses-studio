"use client";
import { useState } from "react";
import { ImageField } from "./ImageField";

export function PairsField({ name, label, defaultValue, help }: { name: string; label: string; defaultValue: { title: string; text: string }[]; help?: string }) {
  const [rows, setRows] = useState(defaultValue.length ? defaultValue : [{ title: "", text: "" }]);
  const update = (i: number, key: "title" | "text", v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  return (
    <fieldset className="space-y-3">
      <legend className="admin-label">{label}</legend>
      {help && <p className="-mt-1 text-xs text-muted">{help}</p>}
      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg p-4">
          <div className="grid gap-3">
            <div><label className="text-xs font-semibold text-muted" htmlFor={`${name}.${i}.title`}>Title</label><input id={`${name}.${i}.title`} name={`${name}.${i}.title`} value={row.title} onChange={(e) => update(i, "title", e.target.value)} maxLength={120} className="field mt-1" /></div>
            <div><label className="text-xs font-semibold text-muted" htmlFor={`${name}.${i}.text`}>Text</label><textarea id={`${name}.${i}.text`} name={`${name}.${i}.text`} value={row.text} onChange={(e) => update(i, "text", e.target.value)} maxLength={600} rows={2} className="field mt-1" /></div>
          </div>
          <button type="button" className="btn btn-danger btn-sm mt-3" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      {rows.length < 20 && <button type="button" className="btn btn-outline btn-sm" onClick={() => setRows((r) => [...r, { title: "", text: "" }])}>Add another</button>}
    </fieldset>
  );
}

export function GalleryField({ defaultValue }: { defaultValue: { url: string; alt: string }[] }) {
  const [items, setItems] = useState(defaultValue.map((d, i) => ({ ...d, key: i })));
  const [next, setNext] = useState(defaultValue.length + 1);
  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No gallery images yet.</p>}
      {items.map((it, i) => (
        <div key={it.key} className="rounded-xl border border-line bg-bg p-4">
          <ImageField name={`gallery.${i}.url`} label={`Gallery image ${i + 1}`} defaultValue={it.url} compact />
          <div className="mt-3"><label className="text-xs font-semibold text-muted" htmlFor={`gallery.${i}.alt`}>Image description (alt text)</label><input id={`gallery.${i}.alt`} name={`gallery.${i}.alt`} defaultValue={it.alt} maxLength={200} className="field mt-1" /></div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => setItems((l) => { const c = [...l]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })}>Move up</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={i === items.length - 1} onClick={() => setItems((l) => { const c = [...l]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; return c; })}>Move down</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setItems((l) => l.filter((_, j) => j !== i))}>Remove</button>
          </div>
        </div>
      ))}
      {items.length < 60 && <button type="button" className="btn btn-outline btn-sm" onClick={() => { setItems((l) => [...l, { url: "", alt: "", key: next }]); setNext((n) => n + 1); }}>Add gallery image</button>}
    </div>
  );
}
