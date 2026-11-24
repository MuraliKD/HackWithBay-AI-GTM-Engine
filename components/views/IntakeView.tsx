"use client";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Btn, PageHeader } from "../ui";

export function IntakeView() {
  const s = useStore();
  const [mode, setMode] = useState<"chat" | "form">("chat");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        kicker="Module 1 · Product intake"
        title="Describe what you sell."
        lede="Plain English is enough. The engine extracts features, reference customers and pricing, then infers who should buy it."
        right={
          <div className="flex rounded-md border border-line p-0.5 text-[12px]">
            {(["chat", "form"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded px-2.5 py-1 capitalize ${mode === m ? "bg-ink text-paper" : "text-muted"}`}>{m}</button>
            ))}
          </div>
        }
      />
      {mode === "chat" ? (
        <div className="space-y-4">
          {s.chat.map((m, i) => (
            <div key={i} className={`fadein flex ${m.role === "user" ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-[14px] leading-relaxed ${m.role === "user" ? "bg-ink text-paper" : "border border-line bg-panel font-serif text-[16px]"}`}>{m.text}</div>
            </div>
          ))}
          {!s.icp && (
            <div className="rounded-lg border border-line bg-panel p-3">
              <textarea
                value={s.product}
                onChange={(e) => s.setProduct(e.target.value)}
                rows={8}
                className="w-full resize-none bg-transparent text-[14px] leading-relaxed outline-none"
              />
              <div className="flex justify-end">
                <Btn onClick={s.runIcp} disabled={!!s.busy}>
                  {s.busy === "icp" ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} Infer my ICP
                </Btn>
              </div>
            </div>
          )}
          {s.icp && <Btn onClick={() => s.setView("icp")}>Review ICP <ArrowRight size={14} /></Btn>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-panel p-5 text-[13px]">
          {[
            ["Core features", "Event metering, credits & wallets, hybrid plans, invoicing"],
            ["Technical constraints", "Self-host or cloud; SDKs for Node, Python, Go"],
            ["Reference customers", "AI API startups, Series A–B"],
            ["Pricing model", "Usage + platform fee"],
            ["Typical contract", "$500–$5k / month"],
            ["Sales motion", "Founder-led, product-led trials"],
          ].map(([k, v]) => (
            <label key={k} className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{k}</span>
              <input defaultValue={v} className="mt-1 w-full rounded border border-line bg-paper px-2.5 py-1.5 outline-none focus:border-ink/40" />
            </label>
          ))}
          <div className="col-span-2 flex justify-end">
            <Btn onClick={() => { setMode("chat"); s.runIcp(); }} disabled={!!s.busy || !!s.icp}><ArrowRight size={14} /> Infer my ICP</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
