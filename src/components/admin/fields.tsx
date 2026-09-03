"use client";

import { useId, useState, type ReactNode } from "react";
import { uploadImage } from "./backend";

export function Text({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: "text" | "url"; placeholder?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Area({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Num({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="field field__row">
      <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: readonly T[] | { value: T; label: string }[] }) {
  const id = useId();
  const opts = (options as unknown[]).map((o) => (typeof o === "string" ? { value: o as T, label: o } : (o as { value: T; label: string })));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Tags({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Text
      label={`${label} (comma separated)`}
      value={value.join(", ")}
      onChange={(v) =>
        onChange(
          v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

export function Lines({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return <Area label={`${label} (one per line)`} value={value.join("\n")} onChange={(v) => onChange(v.split("\n").filter((l) => l.trim().length > 0))} />;
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [status, setStatus] = useState("");
  const upload = async (file: File) => {
    setStatus("uploading…");
    const res = await uploadImage(file);
    if (!res.ok) {
      setStatus(res.error);
      return;
    }
    onChange(res.url);
    setStatus("uploaded");
  };
  return (
    <div className="field">
      <label>{label}</label>
      <div className="field__row">
        {}
        {value && <img className="admin__preview" src={value} alt="" />}
        <input type="text" value={value} placeholder="/uploads/… or https://…" onChange={(e) => onChange(e.target.value)} />
        <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} aria-label={`upload ${label}`} />
      </div>
      {status && <span className="admin__status">{status}</span>}
    </div>
  );
}

let seq = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`;

export function ListEditor<T extends { id: string }>({
  items,
  onChange,
  make,
  render,
  title,
  addLabel = "add",
}: {
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  title: (item: T, index: number) => string;
  addLabel?: string;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      {items.map((item, i) => (
        <details key={item.id} className="admin__item">
          <summary>{title(item, i) || `(untitled ${i + 1})`}</summary>
          <div className="admin__item-head">
            <span className="admin__status">id: {item.id}</span>
            <div>
              <button type="button" className="admin__btn" onClick={() => move(i, -1)} aria-label="move up">
                ↑
              </button>
              <button type="button" className="admin__btn" onClick={() => move(i, 1)} aria-label="move down">
                ↓
              </button>
              <button type="button" className="admin__btn admin__btn--danger" onClick={() => onChange(items.filter((_, k) => k !== i))}>
                remove
              </button>
            </div>
          </div>
          {render(item, (patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it))), i)}
        </details>
      ))}
      <button type="button" className="admin__btn" onClick={() => onChange([...items, make()])}>
        + {addLabel}
      </button>
    </div>
  );
}
