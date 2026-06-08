"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calcMetrics, calcAdherence, calcRoutineScore } from "@/lib/domain/metrics";
import { CHECKLIST_DEF } from "@/lib/domain/constants";
import { fmt$, fmtDate } from "@/lib/domain/format";
import { Printer, Download, X } from "lucide-react";
import type { FlatTrade } from "./journal-view";

interface Props {
  ft: FlatTrade;
  onClose: () => void;
}

export function TradeFullView({ ft, onClose }: Props) {
  const t = ft.trade;
  const m = calcMetrics(t);
  const adherence = calcAdherence(t);
  const pnlColor = m.pnl >= 0 ? "text-emerald-600" : "text-rose-600";
  const isWin = t.outcome === "Win" || t.outcome === "Target hit";
  const contentRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch("/api/trade-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ft }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "PDF download failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Trade-${t.instrument}-${t.occurredAt.slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="print-scope fixed inset-0 z-[9999] flex flex-col bg-background">
      <style>{`
        @media print {
          @page {
            margin: 12mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          body > * {
            display: none !important;
          }
          body > *:has(.print-scope) {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .print-scope {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          .print-scope img {
            max-height: 220px !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-scope .max-w-5xl {
            padding: 0.5rem !important;
            max-width: 100% !important;
          }
          .print-scope h1 {
            font-size: 1.25rem !important;
          }
          .print-scope h2 {
            font-size: 0.9rem !important;
            margin-bottom: 0.25rem !important;
          }
          .print-scope h3 {
            font-size: 0.65rem !important;
            margin-bottom: 0.25rem !important;
          }
          .print-scope .mb-8 {
            margin-bottom: 0.5rem !important;
          }
          .print-scope .pb-6 {
            padding-bottom: 0.5rem !important;
          }
          .print-scope .gap-4 {
            gap: 0.375rem !important;
          }
          .print-scope .gap-6 {
            gap: 0.5rem !important;
          }
          .print-scope .gap-3 {
            gap: 0.25rem !important;
          }
          .print-scope .p-4 {
            padding: 0.375rem !important;
          }
          .print-scope .p-5 {
            padding: 0.375rem !important;
          }
          .print-scope .p-3 {
            padding: 0.25rem !important;
          }
          .print-scope .mt-6 {
            margin-top: 0.375rem !important;
          }
          .print-scope .mt-4 {
            margin-top: 0.375rem !important;
          }
          .print-scope .mt-3 {
            margin-top: 0.25rem !important;
          }
          .print-scope .mt-2 {
            margin-top: 0.125rem !important;
          }
          .print-scope .mt-1 {
            margin-top: 0.125rem !important;
          }
          .print-scope .space-y-4 > * + * {
            margin-top: 0.375rem !important;
          }
          .print-scope .space-y-2 > * + * {
            margin-top: 0.125rem !important;
          }
          .print-scope .text-4xl {
            font-size: 1.5rem !important;
          }
          .print-scope .text-3xl {
            font-size: 1.25rem !important;
          }
          .print-scope .text-2xl {
            font-size: 1.1rem !important;
          }
          .print-scope .text-xl {
            font-size: 0.85rem !important;
          }
          .print-scope .text-lg {
            font-size: 0.8rem !important;
          }
          .print-scope .text-sm {
            font-size: 0.7rem !important;
          }
          .print-scope .text-xs {
            font-size: 0.6rem !important;
          }
          .print-scope .text-\[10px\] {
            font-size: 0.55rem !important;
          }
          .print-scope img {
            max-height: 280px !important;
            width: 100% !important;
          }
          nav, header, .sticky, [class*="backdrop-blur"] {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Bar */}
      <div className="no-print flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="mr-1 h-4 w-4" /> Close
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? (
              <>Generating…</>
            ) : (
              <><Download className="mr-1.5 h-4 w-4" /> Download PDF</>
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="mx-auto max-w-5xl p-8">
          {/* Header + Stat Strip */}
          <div className="print-break mb-8 border-b pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight">{t.instrument}</h1>
                  <Badge
                    className={
                      t.direction === "Long"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                    }
                  >
                    {t.direction}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      isWin
                        ? "border-emerald-300 text-emerald-700"
                        : t.outcome === "Loss"
                          ? "border-rose-300 text-rose-700"
                          : "border-amber-300 text-amber-700"
                    }
                  >
                    {t.outcome}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {fmtDate(t.occurredAt)} · {t.sessionWindow} · Session: {ft.sessionDate}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-extrabold tracking-tighter ${pnlColor}`}>
                  {fmt$(m.pnl)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {m.rr}:1 RR · {m.rt} Risk Ticks · {adherence}% Adherence
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MetricBox label="R (risk ticks)" value={String(m.rt)} />
              <MetricBox label="Reward ticks" value={String(m.rwt)} />
              <MetricBox label="R:R" value={`${m.rr}:1`} />
              <MetricBox label="P&L" value={fmt$(m.pnl)} tone={m.pnl > 0 ? "good" : m.pnl < 0 ? "bad" : undefined} />
              <MetricBox label="Adherence" value={`${adherence}%`} tone={adherence >= 80 ? "good" : adherence < 50 ? "bad" : "warn"} />
            </div>
          </div>



          {/* Trade Meta */}
          <div className="print-break mb-8">
            <h2 className="mb-4 text-lg font-bold">Trade Meta</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Instrument</div>
                <div className="mt-1 font-medium">{t.instrument}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Direction</div>
                <div className="mt-1 font-medium">{t.direction}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Session</div>
                <div className="mt-1 font-medium">{t.sessionWindow}</div>
              </div>
            </div>
          </div>

          {/* Entries & Exits */}
          <div className="print-break mb-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Entries
              </h3>
              <div className="space-y-2">
                {t.entries.map((en, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{en.time || `Entry ${i + 1}`}</span>
                    <span className="font-mono font-medium">
                      {en.contracts} @ {en.price || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Exits
              </h3>
              <div className="space-y-2">
                {t.exits.map((ex, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ex.time || `Exit ${i + 1}`}</span>
                    <span className="font-mono font-medium">
                      {ex.contracts} @ {ex.price || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk & Outcome */}
          <div className="print-break mb-8">
            <h2 className="mb-4 text-lg font-bold">Risk & Outcome</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Stop</div>
                <div className="mt-1 font-mono text-xl font-bold">{t.stopPrice || "—"}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Target</div>
                <div className="mt-1 font-mono text-xl font-bold">{t.targetPrice || "—"}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Contracts</div>
                <div className="mt-1 font-mono text-xl font-bold">{t.contracts}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Outcome</div>
                <div className="mt-1 font-medium text-lg">{t.outcome}</div>
              </div>
            </div>
          </div>

          {/* Setup */}
          <div className="print-break mb-8">
            <h2 className="mb-4 text-lg font-bold">Setup</h2>
            <div className="rounded-lg border p-5">
              <div className="grid gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Primary Setup</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {t.setup.primary || "—"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HTF Bias</span>
                  <span className="font-medium">
                    {t.setup.htfBias} on {t.setup.htfTimeframe}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Model</span>
                  <span className="font-medium">{t.setup.entryModel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Took Liquidity Before Entry</span>
                  <span className={t.setup.tookLiquidityBeforeEntry ? "text-emerald-600 font-medium" : "text-gray-400 font-medium"}>
                    {t.setup.tookLiquidityBeforeEntry || "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="print-break mb-8">
            <h2 className="mb-4 text-lg font-bold">Pre-Trade Checklist</h2>
            <div className="rounded-lg border p-5">
              <div className="space-y-2">
                {CHECKLIST_DEF.map((item) => {
                  const v = t.checklist[item.key];
                  return (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span
                        className={
                          v === "Yes"
                            ? "font-bold text-emerald-600"
                            : v === "No"
                              ? "font-bold text-rose-600"
                              : "text-gray-400"
                        }
                      >
                        {v}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Psychology */}
          <div className="print-break mb-8">
            <h2 className="mb-4 text-lg font-bold">Execution & Psychology</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Setup Plan Level</div>
                <div className="mt-1 text-lg font-bold">{t.psychology.setupPlanLevel}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Emotional State</div>
                <div className="mt-1 text-lg font-bold">{t.executionReview.emotionalState ?? "—"}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Waited for Setup</div>
                <div className="mt-1 text-lg font-bold">{t.psychology.waitedForSetup}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Moved Stop</div>
                <div className="mt-1 text-lg font-bold">{t.psychology.movedStop}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Exited Early</div>
                <div className="mt-1 text-lg font-bold">{t.psychology.exitedEarly}</div>
              </div>
              {t.psychology.exitedEarly === "Yes" && (
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Why Exited Early</div>
                  <div className="mt-1 font-medium">{t.psychology.exitedEarlyWhy}</div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <div className="mb-2 text-xs font-bold uppercase text-emerald-700">What did I do right?</div>
                <div className="whitespace-pre-wrap text-sm text-emerald-900">
                  {t.psychology.whatDidIRight || "No notes."}
                </div>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                <div className="mb-2 text-xs font-bold uppercase text-rose-700">What did I do wrong?</div>
                <div className="whitespace-pre-wrap text-sm text-rose-900">
                  {t.psychology.whatDidIWrong || "No notes."}
                </div>
              </div>
            </div>
          </div>

          {/* Screenshots */}
          {(t.htfUrl || t.ltfUrl) && (
            <div className="print-break mb-8">
              <h2 className="mb-4 text-lg font-bold">Screenshots</h2>
              <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                {t.htfUrl && (
                  <div className="rounded-lg border print-break">
                    <div className="bg-muted px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      HTF
                    </div>
                    <img
                      src={t.htfUrl}
                      className="w-full object-contain md:max-h-[320px]"
                      alt="HTF Chart"
                    />
                  </div>
                )}
                {t.ltfUrl && (
                  <div className="rounded-lg border print-break">
                    <div className="bg-muted px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      LTF
                    </div>
                    <img
                      src={t.ltfUrl}
                      className="w-full object-contain md:max-h-[320px]"
                      alt="LTF Chart"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Routine */}
          <div className="print-break mb-8">
            <h2 className="mb-4 text-lg font-bold">Session Routine</h2>
            {ft.routine ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <span className="text-sm font-medium">Routine Score</span>
                  <span
                    className={`text-2xl font-extrabold ${
                      calcRoutineScore(ft.routine) >= 80 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {calcRoutineScore(ft.routine)}%
                  </span>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Discipline
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(["meditation", "workout", "tradeJournal"] as const).map((k) => (
                      <Badge
                        key={k}
                        variant={ft.routine.discipline?.[k] ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {k === "tradeJournal" ? "Journal" : k.charAt(0).toUpperCase() + k.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pre-Market
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["meditation5min", "htfAnalysis", "markLevels", "tradePlan", "newsCheck"] as const
                    ).map((k) => (
                      <Badge
                        key={k}
                        variant={ft.routine.preMarket?.[k] ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {k.replace(/([A-Z])/g, " $1").trim()}
                      </Badge>
                    ))}
                  </div>
                  {ft.routine.preMarket?.stateOfMind && (
                    <div className="mt-3">
                      <div className="text-xs uppercase text-muted-foreground">State of Mind</div>
                      <div className="text-sm">{ft.routine.preMarket.stateOfMind}</div>
                    </div>
                  )}
                  {ft.routine.preMarket?.preMarketNotes && (
                    <div className="mt-3">
                      <div className="text-xs uppercase text-muted-foreground">Market Context & Trade Plan</div>
                      <div className="text-sm">{ft.routine.preMarket.preMarketNotes}</div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <p className="text-muted-foreground">No routine logged for this session.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-600"
      : tone === "bad"
        ? "text-rose-600"
        : tone === "warn"
          ? "text-amber-600"
          : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
