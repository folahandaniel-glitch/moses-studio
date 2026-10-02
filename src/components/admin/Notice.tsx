"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Toast driven by ?notice= and ?error= query parameters set by server actions. */
export function Notice({ notice, error }: { notice?: string; error?: string }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); router.replace(pathname, { scroll: false }); }, error ? 9000 : 4500);
    return () => clearTimeout(t);
  }, [notice, error, router, pathname]);
  if (!visible || (!notice && !error)) return null;
  return (
    <div role={error ? "alert" : "status"} className={`fixed bottom-5 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl px-5 py-4 text-sm font-semibold shadow-xl ${error ? "bg-red-600 text-white" : "bg-ink text-bg"}`}>
      {error ?? notice}
      <button type="button" onClick={() => setVisible(false)} className="float-right -mr-2 -mt-1 px-2 text-lg leading-none opacity-70 hover:opacity-100" aria-label="Dismiss message">&times;</button>
    </div>
  );
}
