"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, MoreVertical, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcMetrics, calcAdherence, calcRoutineScore } from "@/lib/domain/metrics";
import { CHECKLIST_DEF } from "@/lib/domain/constants";
import { fmt$, fmtDate } from "@/lib/domain/format";
import { deleteSession, deleteTrade } from "@/app/actions/sessions";
import { ZoomableImageModal } from "@/components/dashboard/zoomable-image-modal";
import { TradeFullView } from "@/components/trade-full-view";
import type { DraftSession, DraftTrade } from "@/lib/domain/types";

export interface FlatTrade {
  sessionId: string;
  sessionDate: string;
  routine: DraftSession["routine"];
  trade: DraftTrade;
}

export function JournalView({ sessions, basePath = "/" }: { sessions: DraftSession[]; basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<
    | { kind: "session"; sessionId: string; date: string }
    | { kind: "trade"; tradeId: string }
    | null
  >(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "pnl" | "rr">("date");
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [viewFullTrade, setViewFullTrade] = useState<FlatTrade | null>(null);

  // Flatten sessions into trades
  const flatTrades: FlatTrade[] = useMemo(() => {
    const list: FlatTrade[] = [];
    for (const s of sessions) {
      for (const t of s.trades) {
        list.push({
          sessionId: s.id!,
          sessionDate: s.date,
          routine: s.routine,
          trade: t,
        });
      }
    }
    return list.sort((a, b) => b.trade.occurredAt.localeCompare(a.trade.occurredAt));
  }, [sessions]);

  const dateFilter = searchParams.get("date");

  // Auto-select first trade when date filter changes
  useEffect(() => {
    if (dateFilter && flatTrades.length > 0) {
      const matches = flatTrades.filter((ft) => ft.sessionDate === dateFilter || ft.sessionDate.slice(0, 10) === dateFilter);
      if (matches.length > 0) {
        setSelectedTradeId(matches[0].trade.id ?? matches[0].trade.occurredAt);
      }
    }
  }, [dateFilter, flatTrades]);

  const filtered = useMemo(() => {
    let list = [...flatTrades];

    // Date filter from calendar click
    if (dateFilter) {
      list = list.filter((ft) => ft.sessionDate === dateFilter || ft.sessionDate.slice(0, 10) === dateFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((ft) => {
        const t = ft.trade;
        return (
          t.instrument.toLowerCase().includes(q) ||
          t.direction.toLowerCase().includes(q) ||
          t.outcome.toLowerCase().includes(q) ||
          t.sessionWindow.toLowerCase().includes(q) ||
          t.setup.primary.toLowerCase().includes(q) ||
          t.setup.entryModel.toLowerCase().includes(q) ||
          t.psychology.whatDidIRight.toLowerCase().includes(q) ||
          t.psychology.whatDidIWrong.toLowerCase().includes(q)
        );
      });
    }

    // Filter chips
    switch (filter) {
      case "wins":
        list = list.filter((ft) => calcMetrics(ft.trade).pnl > 0);
        break;
      case "losses":
        list = list.filter((ft) => calcMetrics(ft.trade).pnl < 0);
        break;
      case "breakeven":
        list = list.filter((ft) => calcMetrics(ft.trade).pnl === 0);
        break;
      case "long":
        list = list.filter((ft) => ft.trade.direction === "Long");
        break;
      case "short":
        list = list.filter((ft) => ft.trade.direction === "Short");
        break;
      case "mnq":
        list = list.filter((ft) => ft.trade.instrument === "MNQ");
        break;
      case "mes":
        list = list.filter((ft) => ft.trade.instrument === "MES");
        break;
      case "a++":
        list = list.filter((ft) => ft.trade.psychology.setupPlanLevel === "A++");
        break;
    }

    // Sort
    list.sort((a, b) => {
      const ma = calcMetrics(a.trade);
      const mb = calcMetrics(b.trade);
      if (sortBy === "pnl") return mb.pnl - ma.pnl;
      if (sortBy === "rr") return mb.rr - ma.rr;
      return b.trade.occurredAt.localeCompare(a.trade.occurredAt);
    });

    return list;
  }, [flatTrades, search, filter, sortBy]);

  const selected = useMemo(() => {
    if (!selectedTradeId) return null;
    return filtered.find((ft) => (ft.trade.id ?? ft.trade.occurredAt) === selectedTradeId) ?? null;
  }, [filtered, selectedTradeId]);

  // Auto-select first trade if none selected
  useEffect(() => {
    if (!selectedTradeId && filtered.length > 0) {
      setSelectedTradeId(filtered[0].trade.id ?? filtered[0].trade.occurredAt);
    }
  }, [filtered, selectedTradeId]);

  function runDelete() {
    if (!confirm) return;
    startTransition(async () => {
      try {
        if (confirm.kind === "session") await deleteSession(confirm.sessionId);
        else await deleteTrade(confirm.tradeId);
        toast.success("Deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setConfirm(null);
      }
    });
  }

  const filterChips = [
    { key: "all", label: "All" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "breakeven", label: "BE" },
    { key: "long", label: "Long" },
    { key: "short", label: "Short" },
    { key: "mnq", label: "MNQ" },
    { key: "mes", label: "MES" },
    { key: "a++", label: "A++" },
  ];

  if (!sessions.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <p>No sessions yet.</p>
          <Link href={`${basePath}log`} className={buttonVariants()}>
            Log your first session
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[380px_1fr]">
      {/* LEFT PANE — Trade List */}
      <div className="flex flex-col gap-3 overflow-hidden">
        {/* Date filter banner */}
        {dateFilter && (
          <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2">
            <span className="text-sm font-medium">
              Showing trades from <span className="font-bold text-blue-400">{dateFilter}</span>
            </span>
            <Link
              href={`${basePath}journal`}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
              onClick={() => setSelectedTradeId(null)}
            >
              Show all →
            </Link>
          </div>
        )}

        {/* Search + Sort */}
        <div className="flex gap-2">
          <Input
            placeholder="Search trades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            disabled={!!dateFilter}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border bg-background px-2 py-1 text-xs"
            disabled={!!dateFilter}
          >
            <option value="date">Date</option>
            <option value="pnl">P&L</option>
            <option value="rr">R:R</option>
          </select>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold transition",
                filter === chip.key
                  ? "bg-blue-600 text-white"
                  : "border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {filtered.length} trades
        </div>

        {/* Trade List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {filtered.map((ft) => {
            const t = ft.trade;
            const m = calcMetrics(t);
            const isSelected = (t.id ?? t.occurredAt) === selectedTradeId;
            const isWin = m.pnl > 0;

            return (
              <div
                key={t.id ?? t.occurredAt}
                onClick={() => setSelectedTradeId(t.id ?? t.occurredAt)}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition",
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30"
                    : "border-white/[0.04] bg-card hover:border-white/[0.1] hover:bg-white/[0.02]",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.instrument}
                    </Badge>
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        t.direction === "Long" ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {t.direction}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(`${ft.sessionDate}T12:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={cn(
                      "text-xl font-extrabold tracking-tight",
                      isWin ? "text-emerald-400" : m.pnl < 0 ? "text-rose-400" : "text-foreground",
                    )}
                  >
                    {fmt$(m.pnl)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      t.outcome === "Win" || t.outcome === "Target hit"
                        ? "border-emerald-500/30 text-emerald-400"
                        : t.outcome === "Loss"
                          ? "border-rose-500/30 text-rose-400"
                          : "border-amber-500/30 text-amber-400",
                    )}
                  >
                    {t.outcome}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>R:R {m.rr}:1</span>
                  <span>·</span>
                  <span>{t.sessionWindow}</span>
                  {t.setup.primary && (
                    <>
                      <span>·</span>
                      <span className="max-w-[120px] truncate">{t.setup.primary}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE — Detail View */}
      <div className="flex flex-col overflow-hidden">
        {!selected ? (
          <Card className="flex h-full items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <p>Select a trade to view details</p>
            </CardContent>
          </Card>
        ) : (
          <TradeDetailPane
            ft={selected}
            onViewFull={() => setViewFullTrade(selected)}
            onDeleteTrade={(id) => setConfirm({ kind: "trade", tradeId: id })}
            onDeleteSession={(id, date) => setConfirm({ kind: "session", sessionId: id, date })}
            basePath={basePath}
          />
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete{" "}
              {confirm?.kind === "session"
                ? `the session on ${confirm.date}`
                : "this trade"}
              ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={runDelete} disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewFullTrade && (
        <TradeFullView ft={viewFullTrade} onClose={() => setViewFullTrade(null)} />
      )}
    </div>
  );
}

/* ==================== Trade Detail Pane ==================== */

function TradeDetailPane({
  ft,
  onViewFull,
  onDeleteTrade,
  onDeleteSession,
  basePath = "/",
}: {
  ft: FlatTrade;
  onViewFull: () => void;
  onDeleteTrade: (id: string) => void;
  onDeleteSession: (id: string, date: string) => void;
  basePath?: string;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const t = ft.trade;
  const m = calcMetrics(t);
  const adherence = calcAdherence(t);
  const pnlColor = m.pnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const isWin = t.outcome === "Win" || t.outcome === "Target hit";

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-lg border bg-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold">{t.instrument}</span>
            <Badge
              className={
                t.direction === "Long"
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/20"
              }
            >
              {t.direction}
            </Badge>
            <Badge
              variant="outline"
              className={
                isWin
                  ? "border-emerald-500/30 text-emerald-400"
                  : t.outcome === "Loss"
                    ? "border-rose-500/30 text-rose-400"
                    : "border-amber-500/30 text-amber-400"
              }
            >
              {t.outcome}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {fmtDate(t.occurredAt)} · {t.sessionWindow} · {ft.sessionDate}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right">
            <div className={`text-3xl font-extrabold tracking-tighter ${pnlColor}`}>
              {fmt$(m.pnl)}
            </div>
            <div className="text-xs text-muted-foreground">
              {m.rr}:1 RR · {m.rt} Risk Ticks
            </div>
          </div>
          <ActionsDropdown
            onEdit={() => { window.location.href = `${basePath}log/${ft.sessionDate}`; }}
            onViewFull={onViewFull}
            onDeleteTrade={t.id ? () => onDeleteTrade(t.id!) : undefined}
            onDeleteSession={() => onDeleteSession(ft.sessionId, ft.sessionDate)}
          />
        </div>
      </div>

      {/* Screenshots */}
      {(t.htfUrl || t.ltfUrl) && (
        <div className="grid grid-cols-2 gap-3">
          {t.htfUrl && (
            <div
              className="cursor-pointer overflow-hidden rounded-lg border border-white/[0.06] transition hover:opacity-90"
              onClick={() => setPreviewImage(t.htfUrl)}
            >
              <div className="bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                HTF
              </div>
              <img src={t.htfUrl} className="h-40 w-full object-cover" alt="HTF" />
            </div>
          )}
          {t.ltfUrl && (
            <div
              className="cursor-pointer overflow-hidden rounded-lg border border-white/[0.06] transition hover:opacity-90"
              onClick={() => setPreviewImage(t.ltfUrl)}
            >
              <div className="bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                LTF
              </div>
              <img src={t.ltfUrl} className="h-40 w-full object-cover" alt="LTF" />
            </div>
          )}
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="setup" className="flex-1">Setup</TabsTrigger>
          <TabsTrigger value="psychology" className="flex-1">Psychology</TabsTrigger>
          <TabsTrigger value="routine" className="flex-1">Routine</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-2">
            <MetricBox label="Risk Ticks" value={String(m.rt)} />
            <MetricBox label="Reward Ticks" value={String(m.rwt)} />
            <MetricBox label="R:R" value={`${m.rr}:1`} />
            <MetricBox
              label="Adherence"
              value={`${adherence}%`}
              tone={adherence >= 80 ? "good" : adherence < 50 ? "bad" : "warn"}
            />
          </div>

          {/* Entry/Exit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Entry Legs
              </h4>
              <div className="space-y-1">
                {t.entries.map((en, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{en.time || `Entry ${i + 1}`}</span>
                    <span className="font-mono">{en.contracts} @ {en.price || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Exit Legs
              </h4>
              <div className="space-y-1">
                {t.exits.map((ex, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ex.time || `Exit ${i + 1}`}</span>
                    <span className="font-mono">{ex.contracts} @ {ex.price || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Avg Entry</div>
              <div className="font-mono text-lg font-bold">{m.avgEntryPrice ? m.avgEntryPrice.toFixed(2) : "—"}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Stop</div>
              <div className="font-mono text-lg font-bold">{t.stopPrice || "—"}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Target</div>
              <div className="font-mono text-lg font-bold">{t.targetPrice || "—"}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="setup" className="mt-4 space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Setup Context
            </h4>
            <div className="grid gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Primary Setup</span>
                <Badge variant="secondary" className="text-[10px]">
                  {t.setup.primary || "—"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">HTF Bias</span>
                <span className="font-medium">{t.setup.htfBias} on {t.setup.htfTimeframe}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entry Module</span>
                <span className="font-medium">{t.setup.entryModel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Took Liquidity Before Entry</span>
                <span className={t.setup.tookLiquidityBeforeEntry ? "text-emerald-400" : "text-gray-500"}>
                  {t.setup.tookLiquidityBeforeEntry || "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pre-Trade Checklist
            </h4>
            <div className="space-y-2">
              {CHECKLIST_DEF.map((item) => {
                const v = t.checklist[item.key];
                return (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span
                      className={
                        v === "Yes"
                          ? "font-bold text-emerald-400"
                          : v === "No"
                            ? "font-bold text-rose-400"
                            : "text-gray-500"
                      }
                    >
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="psychology" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Setup Plan Level</div>
              <div className="mt-1 text-lg font-bold">{t.psychology.setupPlanLevel}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Emotional State</div>
              <div className="mt-1 text-lg font-bold">{t.executionReview.emotionalState ?? "—"}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Waited for Setup</div>
              <div className="mt-1 text-lg font-bold">{t.psychology.waitedForSetup}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Moved Stop</div>
              <div className="mt-1 text-lg font-bold">{t.psychology.movedStop}</div>
            </div>
          </div>

          {t.psychology.exitedEarly === "Yes" && (
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Why Exited Early</div>
              <div className="mt-1 font-medium">{t.psychology.exitedEarlyWhy}</div>
            </div>
          )}

          <div className="grid gap-3">
            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4">
              <div className="mb-2 text-[10px] uppercase text-emerald-600/70">What did I do right?</div>
              <div className="whitespace-pre-wrap text-sm italic text-emerald-100/80">
                {t.psychology.whatDidIRight || "No notes."}
              </div>
            </div>
            <div className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-4">
              <div className="mb-2 text-[10px] uppercase text-rose-600/70">What did I do wrong?</div>
              <div className="whitespace-pre-wrap text-sm italic text-rose-100/80">
                {t.psychology.whatDidIWrong || "No notes."}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="routine" className="mt-4 space-y-4">
          {ft.routine ? (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm font-medium">Routine Score</span>
                <span
                  className={`text-2xl font-extrabold ${
                    calcRoutineScore(ft.routine) >= 80 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {calcRoutineScore(ft.routine)}%
                </span>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Discipline
                </h4>
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
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pre-Market
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(["meditation5min", "htfAnalysis", "markLevels", "tradePlan", "newsCheck"] as const).map(
                    (k) => (
                      <Badge
                        key={k}
                        variant={ft.routine.preMarket?.[k] ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {k.replace(/([A-Z])/g, " $1").trim()}
                      </Badge>
                    ),
                  )}
                </div>
                {ft.routine.preMarket?.stateOfMind && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase text-muted-foreground">State of Mind</div>
                    <div className="text-sm">{ft.routine.preMarket.stateOfMind}</div>
                  </div>
                )}
                {ft.routine.preMarket?.preMarketNotes && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Market Context & Trade Plan</div>
                    <div className="text-sm">{ft.routine.preMarket.preMarketNotes}</div>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {ft.routine.postMarket?.whatDidIRight && (
                  <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4">
                    <div className="mb-1 text-[10px] uppercase text-emerald-600/70">What went right</div>
                    <div className="text-sm">{ft.routine.postMarket.whatDidIRight}</div>
                  </div>
                )}
                {ft.routine.postMarket?.whatDidIWrong && (
                  <div className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-4">
                    <div className="mb-1 text-[10px] uppercase text-rose-600/70">What went wrong</div>
                    <div className="text-sm">{ft.routine.postMarket.whatDidIWrong}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No routine logged for this session.</p>
          )}
        </TabsContent>
      </Tabs>

      {previewImage && (
        <ZoomableImageModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}

function ActionsDropdown({
  onEdit,
  onViewFull,
  onDeleteTrade,
  onDeleteSession,
}: {
  onEdit: () => void;
  onViewFull: () => void;
  onDeleteTrade?: () => void;
  onDeleteSession: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative self-start" ref={ref}>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-white/[0.08] bg-[#0f1117] shadow-xl">
          <button
            onClick={() => { setOpen(false); onViewFull(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.04]"
          >
            <Eye className="h-4 w-4 text-blue-400" /> View Full
          </button>
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.04]"
          >
            <Pencil className="h-4 w-4 text-blue-400" /> Edit Trade
          </button>
          {onDeleteTrade && (
            <button
              onClick={() => { setOpen(false); onDeleteTrade(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.04]"
            >
              <Trash2 className="h-4 w-4 text-rose-400" /> Delete Trade
            </button>
          )}
          <div className="h-px bg-white/[0.06]" />
          <button
            onClick={() => { setOpen(false); onDeleteSession(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.04]"
          >
            <Trash2 className="h-4 w-4 text-rose-400" /> Delete Session
          </button>
        </div>
      )}
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
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "warn"
          ? "text-amber-400"
          : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
