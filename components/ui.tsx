"use client";
import { useState } from "react";
import type { Source, Tier } from "@/lib/types";

export function TierBadge({ tier }: { tier: Tier }) {
  const cls = tier === "A" ? "bg-tiera text-white" : tier === "B" ? "bg-tierb text-white" : "bg-tierc/20 text-tierc";
  return <span className={`inline-flex h-5 items-center rounded px-1.5 text-[11px] font-semibold ${cls}`}>Tier {tier}</span>;
}

export function FitScore({ fit }: { fit: number }) {
  const color = fit >= 80 ? "var(--color-tiera)" : fit >= 60 ? "var(--color-tierb)" : "var(--color-tierc)";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="num w-6 text-right text-[13px] font-semibold">{fit}</span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
        <span className="block h-full rounded-full" style={{ width: `${fit}%`, background: color }} />
      </span>
    </span>
  );
}

export function Confidence({ value }: { value: number }) {
  const color = value >= 0.85 ? "var(--color-tiera)" : value >= 0.75 ? "var(--color-tierb)" : "var(--color-accent)";
  return (
    <span className="inline-flex items-center gap-2" title="Inference confidence">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
        <span className="block h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </span>
      <span className="num text-[12px]" style={{ color }}>{value.toFixed(2)}</span>
    </span>
  );
}

export function SourceChip({ source }: { source: Source }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-line bg-paper px-1 text-[10.5px] text-muted hover:border-accent hover:text-accent"
      >
        {source.id}
      </a>
      {open && (
        <span className="fadein absolute left-0 top-6 z-30 w-72 whitespace-normal rounded-md border border-line bg-panel p-3 text-left text-[12px] shadow-lg">
          <span className="block font-medium text-ink">{source.title}</span>
          <span className="mt-1 block font-serif italic text-ink/80">&ldquo;{source.quote}&rdquo;</span>
          <span className="mt-2 block truncate text-[11px] text-accent">{source.url}</span>
        </span>
      )}
    </span>
  );
}

export function Btn({
  children, onClick, variant = "primary", disabled, className = "",
}: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline"; disabled?: boolean; className?: string }) {
  const base = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  const v = variant === "primary"
    ? "bg-ink text-paper hover:bg-ink/85"
    : variant === "outline"
      ? "border border-line bg-panel hover:border-ink/40"
      : "text-muted hover:text-ink";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${v} ${className}`}>{children}</button>;
}

export function PageHeader({ kicker, title, lede, right }: { kicker: string; title: string; lede?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6 border-b border-line pb-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{kicker}</div>
        <h1 className="mt-1 font-serif text-[30px] leading-tight">{title}</h1>
        {lede && <p className="mt-1 max-w-2xl text-[14px] text-muted">{lede}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-line p-10 text-center text-[14px] text-muted">{text}</div>;
}
