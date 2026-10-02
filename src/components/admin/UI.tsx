import Link from "next/link";
import { Notice } from "./Notice";
import { STATUS_SHORT, type ProjectStatus } from "@/lib/types";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function PageHeader({ title, description, action, sp }: { title: string; description?: string; action?: React.ReactNode; sp?: { notice?: string; error?: string } }) {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}</div>
        {action}
      </div>
      {(sp?.notice || sp?.error) && <Notice notice={sp.notice} error={sp.error} />}
    </>
  );
}

export function Empty({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
      {href && <Link href={href} className="btn btn-primary btn-sm mt-5">{cta}</Link>}
    </div>
  );
}

const STATUS_STYLE: Record<ProjectStatus, string> = { PRECIOUS: "bg-amber-100 text-amber-900", ONGOING: "bg-sky-100 text-sky-900", READY: "bg-emerald-100 text-emerald-900" };
export const StatusBadge = ({ status }: { status: ProjectStatus }) => <span className={`badge ${STATUS_STYLE[status]}`}>{STATUS_SHORT[status]}</span>;
export const PublishBadge = ({ published, on = "Published", off = "Draft" }: { published: boolean; on?: string; off?: string }) => <span className={`badge ${published ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>{published ? "✓ " + on : off}</span>;
