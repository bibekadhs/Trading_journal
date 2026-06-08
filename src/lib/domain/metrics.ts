import { TICK_SIZE, TICK_VALUE } from "./constants";
import type { DraftTrade } from "./types";

export interface TradeMetrics {
  rt: number;
  rwt: number;
  rr: number;
  pnl: number;
  risk$: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  totalEntryContracts: number;
  totalExitContracts: number;
  numExits: number;
}

function toNum(x: number | "" | null | undefined): number {
  if (x === "" || x == null) return NaN;
  return typeof x === "number" ? x : parseFloat(x);
}

export function calcMetrics(t: DraftTrade): TradeMetrics {
  const tv = TICK_VALUE[t.instrument];

  let totalEntryContracts = 0;
  let sumEntryPriceTimesContracts = 0;
  for (const en of t.entries) {
    const p = toNum(en.price);
    const c = Number(en.contracts);
    if (!Number.isNaN(p) && c > 0) {
      sumEntryPriceTimesContracts += p * c;
      totalEntryContracts += c;
    }
  }
  const avgEntryPrice =
    totalEntryContracts > 0 ? sumEntryPriceTimesContracts / totalEntryContracts : 0;

  const stop = toNum(t.stopPrice);
  const target = toNum(t.targetPrice);
  const rt = Number.isFinite(stop)
    ? Math.round(Math.abs(avgEntryPrice - stop) / TICK_SIZE)
    : 0;
  const rwt = Number.isFinite(target)
    ? Math.round(Math.abs(target - avgEntryPrice) / TICK_SIZE)
    : 0;
  const rr = rt > 0 ? Math.round((rwt / rt) * 100) / 100 : 0;

  const riskContracts = totalEntryContracts > 0 ? totalEntryContracts : t.contracts || 1;
  const risk$ = Math.round(rt * tv * riskContracts * 100) / 100;

  let pnl = 0;
  let totalExitContracts = 0;
  let sumExitPriceTimesContracts = 0;
  for (const ex of t.exits) {
    const p = toNum(ex.price);
    const c = Number(ex.contracts);
    if (!Number.isNaN(p) && c > 0) {
      const pnlTicks =
        t.direction === "Long" ? (p - avgEntryPrice) / TICK_SIZE : (avgEntryPrice - p) / TICK_SIZE;
      pnl += pnlTicks * tv * c;
      sumExitPriceTimesContracts += p * c;
      totalExitContracts += c;
    }
  }
  pnl = Math.round(pnl * 100) / 100;
  const avgExitPriceRaw =
    totalExitContracts > 0 ? sumExitPriceTimesContracts / totalExitContracts : 0;
  const avgExitPrice =
    totalExitContracts > 0 ? Math.round(avgExitPriceRaw / TICK_SIZE) * TICK_SIZE : 0;

  return {
    rt,
    rwt,
    rr,
    pnl,
    risk$,
    avgEntryPrice,
    avgExitPrice,
    totalEntryContracts,
    totalExitContracts,
    numExits: t.exits.filter((ex) => ex.price !== "" && Number(ex.contracts) > 0).length,
  };
}

// Checklist adherence as %. A Gamble-rated setup forces 0.
// "Skipped" items are excluded from the denominator.
export function calcAdherence(t: DraftTrade): number {
  if (t.psychology.setupPlanLevel === "Gamble") return 0;
  const entries = Object.entries(t.checklist).filter(([, v]) => v !== "Skipped");
  if (entries.length === 0) return 0;
  const success = entries.filter(([, v]) => v === "Yes").length;
  return Math.round((success / entries.length) * 100);
}

// Suggests an outcome label from average exit vs. stop/target/entry.
// User can override.
export function suggestOutcome(t: DraftTrade): DraftTrade["outcome"] {
  const m = calcMetrics(t);
  if (m.numExits === 0) return "Win";
  const stop = toNum(t.stopPrice);
  const target = toNum(t.targetPrice);
  const { avgEntryPrice: entry, avgExitPrice: exit } = m;
  if (!Number.isFinite(stop) || !Number.isFinite(target)) return "Win";
  if (t.direction === "Long") {
    if (exit >= target - TICK_SIZE / 2) return "Target hit";
    if (exit <= stop + TICK_SIZE / 2) return "Loss";
    if (Math.abs(exit - entry) < TICK_SIZE) return "Breakeven";
    if (exit > entry) return "Win";
    return "Stopped early";
  }
  if (exit <= target + TICK_SIZE / 2) return "Target hit";
  if (exit >= stop - TICK_SIZE / 2) return "Loss";
  if (Math.abs(exit - entry) < TICK_SIZE) return "Breakeven";
  if (exit < entry) return "Win";
  return "Stopped early";
}

export interface RoutineForScore {
  discipline?: { meditation?: boolean; workout?: boolean; tradeJournal?: boolean } | null;
  preMarket?: {
    meditation5min?: boolean;
    htfAnalysis?: boolean;
    markLevels?: boolean;
    tradePlan?: boolean;
    newsCheck?: boolean;
    stateOfMind?: string;
    preMarketNotes?: string;
    journalState?: string;
  } | null;
}

export function calcRoutineScore(r: RoutineForScore | null | undefined): number {
  if (!r) return 0;
  const d = r.discipline ?? {};
  const dCount = [d.meditation, d.workout, d.tradeJournal].filter(Boolean).length;
  const dp = (dCount / 3) * 100;
  const p = r.preMarket ?? {};
  const pBools = [p.meditation5min, p.htfAnalysis, p.markLevels, p.tradePlan, p.newsCheck].filter(
    Boolean,
  ).length;
  const pState = p.stateOfMind ? 1 : 0;
  const pNotes = p.preMarketNotes || p.journalState ? 1 : 0;
  const pp = ((pBools + pState + pNotes) / 7) * 100;
  return Math.round((dp + pp) / 2);
}
