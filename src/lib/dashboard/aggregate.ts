import { calcAdherence, calcMetrics } from "@/lib/domain/metrics";
import { CHECKLIST_DEF, OUTCOMES, SESSION_WINDOWS } from "@/lib/domain/constants";
import type { DraftSession, DraftTrade } from "@/lib/domain/types";

// Determine the hour for time-based profitability:
// - If entry and exit are in the same hour → use that hour
// - If different hours → use whichever hour the trade spent more time in
// - Fall back to occurredAt hour if no leg times are available
function getTradeHour(trade: DraftTrade): number {
  const firstEntry = trade.entries.find((e) => e.time && e.time.length === 5);
  const lastExit = trade.exits
    .slice()
    .reverse()
    .find((e) => e.time && e.time.length === 5);

  if (!firstEntry?.time) {
    return parseInt(trade.occurredAt.slice(11, 13), 10);
  }

  const entryHour = parseInt(firstEntry.time.slice(0, 2), 10);
  const entryMin = parseInt(firstEntry.time.slice(3, 5), 10);

  if (!lastExit?.time) {
    return entryHour;
  }

  const exitHour = parseInt(lastExit.time.slice(0, 2), 10);
  const exitMin = parseInt(lastExit.time.slice(3, 5), 10);

  if (entryHour === exitHour) {
    return entryHour;
  }

  // Minutes spent in entry hour vs exit hour
  const minInEntryHour = 60 - entryMin;
  const minInExitHour = exitMin;

  return minInEntryHour >= minInExitHour ? entryHour : exitHour;
}

export interface DirectionBreakdown {
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export interface DashboardSummary {
  totalTrades: number;
  totalPnl: number;
  wins: number;
  losses: number;
  winRate: number; // %
  expectancy: number; // avg $ per trade
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  avgRR: number;
  aPlusRate: number;
  avgAdh: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  pnlByDay: { date: string; pnl: number }[];
  pnlByHour: { hour: number; pnl: number; trades: number }[];
  pnlByDayOfWeek: { label: string; pnl: number }[];
  winRateBySetup: { setup: string; winRate: number; trades: number }[];
  winRateBySession: { session: string; winRate: number; trades: number }[];
  checklistFailures: { key: string; label: string; failsOnLoss: number }[];
  checklistFailureRate: { key: string; label: string; rate: number }[];
  longs: DirectionBreakdown;
  shorts: DirectionBreakdown;
  emotionVsOutcome: Record<string, Record<string, number>>;
}

const CHECKLIST_LABELS: Record<string, string> = {
  htfBiasConfirmed: "HTF bias confirmed",
  sessionActive: "Proper Time zone",
  validSetup: "Valid ICT Entry Module present",
  stopBeyondStructure: "Stop beyond structure",
  riskInRange: "Risk as per Planning",
};

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function aggregate(sessions: DraftSession[]): DashboardSummary {
  const trades: { date: string; trade: DraftTrade }[] = sessions.flatMap((s) =>
    s.trades.map((t) => ({ date: s.date, trade: t })),
  );

  const totals = {
    pnl: 0,
    wins: 0,
    losses: 0,
    totalWinDollars: 0,
    totalLossDollars: 0,
    grossProfit: 0,
    grossLoss: 0,
    totalRR: 0,
    aPlusCount: 0,
    totalAdh: 0,
  };

  const byDay = new Map<string, number>();
  const byHour = new Map<number, { pnl: number; trades: number }>();
  const byDayOfWeek = new Map<string, number>();
  const bySetup = new Map<string, { wins: number; trades: number }>();
  const bySession = new Map<string, { wins: number; trades: number }>();
  const checklistFails = new Map<string, number>();
  const checklistFailRate = new Map<string, { no: number; total: number }>();
  const longs = { trades: 0, wins: 0, pnl: 0 };
  const shorts = { trades: 0, wins: 0, pnl: 0 };
  const emotionData = new Map<string, Map<string, number>>();

  for (const { date, trade } of trades) {
    const m = calcMetrics(trade);
    totals.pnl += m.pnl;
    totals.totalRR += m.rr;

    if (m.pnl > 0) {
      totals.wins++;
      totals.totalWinDollars += m.pnl;
      totals.grossProfit += m.pnl;
    } else if (m.pnl < 0) {
      totals.losses++;
      totals.totalLossDollars += m.pnl;
      totals.grossLoss += Math.abs(m.pnl);
    }

    if (trade.psychology.setupPlanLevel === "A++") totals.aPlusCount++;
    totals.totalAdh += calcAdherence(trade);

    byDay.set(date, (byDay.get(date) ?? 0) + m.pnl);

    const hour = getTradeHour(trade);
    const curHour = byHour.get(hour) ?? { pnl: 0, trades: 0 };
    curHour.pnl += m.pnl;
    curHour.trades++;
    byHour.set(hour, curHour);

    const dayName = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
    byDayOfWeek.set(dayName, (byDayOfWeek.get(dayName) ?? 0) + m.pnl);

    const setup = trade.setup.primary || "Unspecified";
    const cur = bySetup.get(setup) ?? { wins: 0, trades: 0 };
    cur.trades++;
    if (m.pnl > 0) cur.wins++;
    bySetup.set(setup, cur);

    const sessionKey = trade.sessionWindow;
    const curSession = bySession.get(sessionKey) ?? { wins: 0, trades: 0 };
    curSession.trades++;
    if (m.pnl > 0) curSession.wins++;
    bySession.set(sessionKey, curSession);

    if (m.pnl < 0) {
      for (const [key, val] of Object.entries(trade.checklist)) {
        if (val === "No") checklistFails.set(key, (checklistFails.get(key) ?? 0) + 1);
      }
    }

    for (const [key, val] of Object.entries(trade.checklist)) {
      const cur = checklistFailRate.get(key) ?? { no: 0, total: 0 };
      if (val !== "Skipped") {
        cur.total++;
        if (val === "No") cur.no++;
        checklistFailRate.set(key, cur);
      }
    }

    if (trade.direction === "Long") {
      longs.trades++;
      longs.pnl += m.pnl;
      if (m.pnl > 0) longs.wins++;
    } else {
      shorts.trades++;
      shorts.pnl += m.pnl;
      if (m.pnl > 0) shorts.wins++;
    }

    const emotion = trade.executionReview.emotionalState;
    if (emotion) {
      if (!emotionData.has(emotion)) emotionData.set(emotion, new Map());
      const outcomeMap = emotionData.get(emotion)!;
      outcomeMap.set(trade.outcome, (outcomeMap.get(trade.outcome) ?? 0) + 1);
    }
  }

  const pnlByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }));

  const pnlByHour = [...byHour.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, v]) => ({ hour, pnl: Math.round(v.pnl * 100) / 100, trades: v.trades }));

  const pnlByDayOfWeek = DAY_ORDER.filter((d) => byDayOfWeek.has(d)).map((d) => ({
    label: d,
    pnl: Math.round((byDayOfWeek.get(d) ?? 0) * 100) / 100,
  }));

  const winRateBySetup = [...bySetup.entries()]
    .map(([setup, v]) => ({
      setup,
      trades: v.trades,
      winRate: v.trades ? Math.round((v.wins / v.trades) * 100) : 0,
    }))
    .sort((a, b) => b.trades - a.trades);

  const winRateBySession = SESSION_WINDOWS.filter((s) => bySession.has(s)).map((s) => {
    const v = bySession.get(s)!;
    return { session: s, trades: v.trades, winRate: v.trades ? Math.round((v.wins / v.trades) * 100) : 0 };
  });

  const checklistFailures = [...checklistFails.entries()]
    .map(([key, n]) => ({ key, label: CHECKLIST_LABELS[key] ?? key, failsOnLoss: n }))
    .sort((a, b) => b.failsOnLoss - a.failsOnLoss);

  const checklistFailureRate = [...checklistFailRate.entries()]
    .filter(([, v]) => v.total > 0)
    .map(([key, v]) => ({
      key,
      label: CHECKLIST_LABELS[key] ?? key,
      rate: Math.round((v.no / v.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate);

  const bestDay = pnlByDay.reduce<DashboardSummary["bestDay"]>(
    (best, d) => (best && best.pnl >= d.pnl ? best : { date: d.date, pnl: d.pnl }),
    null,
  );
  const worstDay = pnlByDay.reduce<DashboardSummary["worstDay"]>(
    (worst, d) => (worst && worst.pnl <= d.pnl ? worst : { date: d.date, pnl: d.pnl }),
    null,
  );

  const totalTrades = trades.length;
  const winRate = totalTrades ? Math.round((totals.wins / totalTrades) * 100) : 0;
  const expectancy = totalTrades ? Math.round((totals.pnl / totalTrades) * 100) / 100 : 0;
  const avgWin = totals.wins ? Math.round((totals.totalWinDollars / totals.wins) * 100) / 100 : 0;
  const avgLoss = totals.losses
    ? Math.round((totals.totalLossDollars / totals.losses) * 100) / 100
    : 0;
  const profitFactor = totals.grossLoss === 0 ? (totals.grossProfit > 0 ? 99.99 : 0) : Math.round((totals.grossProfit / totals.grossLoss) * 100) / 100;
  const avgRR = totalTrades ? Math.round((totals.totalRR / totalTrades) * 100) / 100 : 0;
  const aPlusRate = totalTrades ? Math.round((totals.aPlusCount / totalTrades) * 100) : 0;
  const avgAdh = totalTrades ? Math.round(totals.totalAdh / totalTrades) : 0;

  const emotionVsOutcome: Record<string, Record<string, number>> = {};
  for (const [emotion, outcomes] of emotionData) {
    emotionVsOutcome[emotion] = {};
    for (const [outcome, count] of outcomes) {
      emotionVsOutcome[emotion][outcome] = count;
    }
  }

  return {
    totalTrades,
    totalPnl: Math.round(totals.pnl * 100) / 100,
    wins: totals.wins,
    losses: totals.losses,
    winRate,
    expectancy,
    avgWin,
    avgLoss,
    profitFactor,
    avgRR,
    aPlusRate,
    avgAdh,
    bestDay,
    worstDay,
    pnlByDay,
    pnlByHour,
    pnlByDayOfWeek,
    winRateBySetup,
    winRateBySession,
    checklistFailures,
    checklistFailureRate,
    longs: {
      trades: longs.trades,
      wins: longs.wins,
      winRate: longs.trades ? Math.round((longs.wins / longs.trades) * 100) : 0,
      pnl: Math.round(longs.pnl * 100) / 100,
    },
    shorts: {
      trades: shorts.trades,
      wins: shorts.wins,
      winRate: shorts.trades ? Math.round((shorts.wins / shorts.trades) * 100) : 0,
      pnl: Math.round(shorts.pnl * 100) / 100,
    },
    emotionVsOutcome,
  };
}
