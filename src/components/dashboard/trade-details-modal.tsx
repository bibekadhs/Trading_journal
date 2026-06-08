"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { calcMetrics, calcAdherence, calcRoutineScore } from "@/lib/domain/metrics";
import { CHECKLIST_DEF } from "@/lib/domain/constants";
import { fmt$, fmtDate } from "@/lib/domain/format";
import { ZoomableImageModal } from "./zoomable-image-modal";
import type { DraftSession, DraftTrade } from "@/lib/domain/types";

export function TradeDetailsModal({
  trade,
  routine,
  onClose,
}: {
  trade: DraftTrade;
  routine: DraftSession["routine"] | null | undefined;
  onClose: () => void;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const m = useMemo(() => calcMetrics(trade), [trade]);
  const adherence = useMemo(() => calcAdherence(trade), [trade]);
  const pnlColor = m.pnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const isWin = trade.outcome === "Win" || trade.outcome === "Target hit";

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center overflow-y-auto bg-black/80 py-10 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative my-auto flex w-full max-w-4xl flex-col rounded-2xl border border-white/[0.06] bg-[#0f1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/[0.02] p-2 text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col gap-8 p-8">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.04] pb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold tracking-tight text-white">{trade.instrument}</span>
                <span className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-widest ${trade.direction === "Long" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {trade.direction}
                </span>
                <span className={`rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-widest ${isWin ? "border-emerald-500/30 bg-emerald-900/30 text-emerald-400" : trade.outcome === "Loss" ? "border-rose-500/30 bg-rose-900/30 text-rose-400" : "border-amber-500/30 bg-amber-900/30 text-amber-400"}`}>
                  {trade.outcome}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-400">
                {fmtDate(trade.occurredAt)} · {trade.sessionWindow}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className={`text-4xl font-extrabold tracking-tighter ${pnlColor}`}>{fmt$(m.pnl)}</div>
              <div className="text-sm font-semibold text-gray-500">{m.rr}:1 RR · {m.rt} Ticks Risk</div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Routine */}
              {routine && (
                <Card className="border-white/[0.04] bg-[#0a0b10] p-5">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Session Routine</h3>
                    <span className={`text-xs font-extrabold ${calcRoutineScore(routine) >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                      {calcRoutineScore(routine)}% Score
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4">
                    {(["meditation", "workout", "tradeJournal"] as const)
                      .filter((k) => routine.discipline?.[k])
                      .map((k) => (
                        <span key={k} className="rounded bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-gray-400">
                          {k === "tradeJournal" ? "Journal" : k.charAt(0).toUpperCase() + k.slice(1)}
                        </span>
                      ))}
                    {(["meditation5min", "htfAnalysis", "markLevels", "tradePlan", "newsCheck"] as const)
                      .filter((k) => routine.preMarket?.[k])
                      .map((k) => (
                        <span key={k} className="rounded bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-gray-400">
                          {k.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      ))}
                  </div>
                  {(routine.preMarket?.preMarketNotes || routine.postMarket?.whatDidIRight || routine.postMarket?.whatDidIWrong) ? (
                    <div className="mt-2 space-y-3">
                      {routine.preMarket?.preMarketNotes && (
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-gray-600">Pre-Market Notes</div>
                          <div className="text-xs text-gray-300">{routine.preMarket.preMarketNotes}</div>
                        </div>
                      )}
                      {routine.postMarket?.whatDidIRight && (
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-emerald-600/70">What went right</div>
                          <div className="text-xs text-emerald-200/90">{routine.postMarket.whatDidIRight}</div>
                        </div>
                      )}
                      {routine.postMarket?.whatDidIWrong && (
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-rose-600/70">What went wrong</div>
                          <div className="text-xs text-rose-200/90">{routine.postMarket.whatDidIWrong}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 text-xs italic text-gray-500">No routine notes logged for this session.</div>
                  )}
                </Card>
              )}

              {/* Execution Details */}
              <Card className="border-white/[0.04] bg-[#0a0b10] p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Execution Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Avg Entry Price</div>
                    <div className="font-mono text-gray-200">{m.avgEntryPrice ? m.avgEntryPrice.toFixed(2) : "—"}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Stop Loss</div>
                    <div className="font-mono text-gray-200">{trade.stopPrice || "—"}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Target Price</div>
                    <div className="font-mono text-gray-200">{trade.targetPrice || "—"}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Total Contracts</div>
                    <div className="font-mono text-gray-200">{m.totalEntryContracts || trade.contracts}</div>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/[0.04] pt-4">
                  <div className="mb-2 text-[10px] uppercase text-gray-600">Entry Legs</div>
                  {(trade.entries || []).map((en, i) => (
                    <div key={i} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-gray-400">Entry {i + 1}{en.time ? ` (${en.time})` : ""}</span>
                      <span className="font-mono text-gray-200">{en.contracts} @ {en.price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-white/[0.04] pt-4">
                  <div className="mb-2 text-[10px] uppercase text-gray-600">Partial Exits</div>
                  {(trade.exits || []).map((ex, i) => (
                    <div key={i} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-gray-400">Exit {i + 1}{ex.time ? ` (${ex.time})` : ""}</span>
                      <span className="font-mono text-gray-200">{ex.contracts} @ {ex.price}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Setup Context */}
              <Card className="border-white/[0.04] bg-[#0a0b10] p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Setup Context</h3>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Primary Setup</div>
                    <div className="text-sm text-gray-300">{trade.setup.primary || "—"}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">HTF Context</div>
                    <div className="text-sm text-gray-300">{trade.setup.htfBias} on {trade.setup.htfTimeframe}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Entry Model</div>
                    <div className="text-sm text-gray-300">{trade.setup.entryModel}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-gray-600">Took Liquidity Before Entry</div>
                    <div className={`text-xs font-bold ${trade.setup.tookLiquidityBeforeEntry ? "text-emerald-400" : "text-gray-500"}`}>
                      {trade.setup.tookLiquidityBeforeEntry || "No"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Checklist */}
              <Card className="relative overflow-hidden border-white/[0.04] bg-[#0a0b10] p-5">
                <div className={`absolute right-0 top-0 p-4 text-3xl font-extrabold opacity-10 ${adherence >= 80 ? "text-emerald-500" : adherence >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                  {adherence}%
                </div>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Pre-Trade &amp; Execution Rules</h3>
                <div className="mb-3 flex items-center justify-between border-b border-white/[0.04] pb-3">
                  <span className="text-xs font-medium text-gray-400">Setup Plan Level:</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${trade.psychology.setupPlanLevel === "A++" ? "bg-blue-500/20 text-blue-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {trade.psychology.setupPlanLevel || "A++"}
                  </span>
                </div>
                <div className="space-y-2">
                  {CHECKLIST_DEF.map((item) => {
                    const v = trade.checklist[item.key];
                    let icon = <span className="text-gray-600">➖</span>;
                    let color = "text-gray-500";
                    if (v === "Yes") { icon = <span className="text-emerald-500">✓</span>; color = "text-gray-300"; }
                    else if (v === "No") { icon = <span className="text-rose-500">✗</span>; color = "text-gray-400"; }
                    return (
                      <div key={item.key} className="flex items-start gap-2 text-[11px]">
                        {icon}
                        <span className={color}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Post-Trade Reflection */}
              <Card className="border-white/[0.04] bg-[#0a0b10] p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Post-Trade Reflection</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Waited for setup?</span>
                    <span className="font-medium text-gray-200">{trade.psychology.waitedForSetup}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Moved stop?</span>
                    <span className="font-medium text-gray-200">{trade.psychology.movedStop}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Exited early?</span>
                    <span className="font-medium text-gray-200">{trade.psychology.exitedEarly}</span>
                  </div>
                  {trade.psychology.exitedEarly === "Yes" && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Why early?</span>
                      <span className="font-medium text-gray-200">{trade.psychology.exitedEarlyWhy}</span>
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="mb-1 text-[10px] uppercase text-gray-600">What did I do right?</div>
                      <div className="whitespace-pre-wrap rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs italic text-emerald-100/80">
                        {trade.psychology.whatDidIRight || "No notes."}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase text-gray-600">What did I do wrong?</div>
                      <div className="whitespace-pre-wrap rounded-lg border border-rose-500/10 bg-rose-500/5 p-3 text-xs italic text-rose-100/80">
                        {trade.psychology.whatDidIWrong || "No notes."}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Charts / Screenshots */}
          {(trade.htfUrl || trade.ltfUrl) && (
            <Card className="border-white/[0.04] bg-[#0a0b10] p-5">
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Charts</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {trade.htfUrl && (
                  <div>
                    <div className="mb-2 text-center text-[10px] uppercase text-gray-600">Higher Time Frame</div>
                    <img
                      src={trade.htfUrl}
                      className="w-full cursor-pointer rounded-lg border border-white/[0.06] transition hover:opacity-90"
                      onClick={() => setPreviewImage(trade.htfUrl)}
                    />
                  </div>
                )}
                {trade.ltfUrl && (
                  <div>
                    <div className="mb-2 text-center text-[10px] uppercase text-gray-600">Lower Time Frame</div>
                    <img
                      src={trade.ltfUrl}
                      className="w-full cursor-pointer rounded-lg border border-white/[0.06] transition hover:opacity-90"
                      onClick={() => setPreviewImage(trade.ltfUrl)}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {previewImage && <ZoomableImageModal src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
