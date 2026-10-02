import { ImageField } from "./ImageField";
import { PairsField } from "./RepeaterFields";
import type { FieldDef } from "@/lib/sections";

/** Renders one form control for a field definition. */
export function FieldInput({ field, value }: { field: FieldDef; value: unknown }) {
  const id = `f-${field.name}`;
  const help = field.help ? <p id={`${id}-h`} className="mt-1.5 text-xs text-muted">{field.help}</p> : null;
  const label = <label htmlFor={id} className="admin-label">{field.label}</label>;
  const aria = field.help ? { "aria-describedby": `${id}-h` } : {};

  switch (field.type) {
    case "image": return <ImageField name={field.name} label={field.label} defaultValue={String(value ?? "")} help={field.help} />;
    case "pairs": return <PairsField name={field.name} label={field.label} defaultValue={(value as { title: string; text: string }[]) ?? []} help={field.help} />;
    case "textarea": return <div>{label}<textarea id={id} name={field.name} rows={5} maxLength={field.max} defaultValue={String(value ?? "")} className="field" {...aria} />{help}</div>;
    case "lines": return <div>{label}<textarea id={id} name={field.name} rows={5} defaultValue={Array.isArray(value) ? value.join("\n") : ""} className="field" {...aria} />{help}</div>;
    case "color": return <div>{label}<div className="flex items-center gap-3"><input id={id} type="color" name={field.name} defaultValue={String(value || "#000000")} className="h-12 w-20 cursor-pointer rounded-lg border border-line bg-surface p-1" {...aria} /><span className="text-sm text-muted">{String(value ?? "")}</span></div>{help}</div>;
    case "select": return <div>{label}<select id={id} name={field.name} defaultValue={String(value ?? "")} className="field" {...aria}>{field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{help}</div>;
    case "boolean": return <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name={field.name} defaultChecked={Boolean(value ?? true)} className="h-5 w-5 accent-[rgb(var(--c-accent))]" />{field.label}</label>;
    default: return <div>{label}<input id={id} name={field.name} type="text" maxLength={field.max} defaultValue={String(value ?? "")} className="field" {...aria} />{help}</div>;
  }
}
