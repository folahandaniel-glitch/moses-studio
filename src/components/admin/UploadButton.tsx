"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadButton() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError("");
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body }).catch(() => null);
      if (!res || !res.ok) {
        const json = res ? await res.json().catch(() => ({})) : {};
        setError(`${file.name}: ${json.error ?? "upload failed"}`);
        break;
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading..." : "Upload images"}</button>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" aria-label="Upload images" onChange={(e) => onChange(e.target.files)} />
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
