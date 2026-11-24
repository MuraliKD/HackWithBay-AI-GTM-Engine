"use client";
import { Coins } from "lucide-react";
import { useStore } from "@/lib/store";
import { Btn } from "./ui";

export function CreditGate() {
  const { creditGate, credits, closeCreditGate } = useStore();
  if (!creditGate) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30">
      <div className="fadein w-[420px] rounded-lg border border-line bg-panel p-6 shadow-xl">
        <div className="flex items-center gap-2 text-accent"><Coins size={18} /><span className="text-[11px] font-semibold uppercase tracking-wider">Flexprice credit gate</span></div>
        <h2 className="mt-2 font-serif text-[22px]">Not enough credits for this run</h2>
        <p className="mt-2 text-[14px] text-muted">
          Enriching <b className="text-ink">{creditGate.label}</b> needs <b className="num text-ink">{creditGate.needed}</b> credits.
          You have <b className="num text-ink">{credits}</b> left. High-cost enrichment is paused until you top up.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="outline" onClick={closeCreditGate}>Limit to Tier A</Btn>
          <Btn onClick={closeCreditGate}>Top up credits</Btn>
        </div>
      </div>
    </div>
  );
}
