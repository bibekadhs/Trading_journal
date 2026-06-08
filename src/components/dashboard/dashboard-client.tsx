"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { SetupGrid } from "@/components/dashboard/setup-grid";
import { ChecklistFails } from "@/components/dashboard/checklist-fails";
import { ChecklistFailureRate } from "@/components/dashboard/checklist-failure-rate";
import { ExpectancyGrid } from "@/components/dashboard/expectancy-grid";
import { BestWorstDays } from "@/components/dashboard/best-worst-days";
import { DirectionPie } from "@/components/dashboard/direction-pie";
import { TimeProfitability } from "@/components/dashboard/time-profitability";
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar";
import { EmotionTable } from "@/components/dashboard/emotion-table";
import { fmt$ } from "@/lib/domain/format";
import type { DashboardSummary } from "@/lib/dashboard/aggregate";

export function DashboardClient({
  sessionsEmpty,
  s,
}: {
  sessionsEmpty: boolean;
  s: DashboardSummary;
}) {
  const [showMoney, setShowMoney] = useState(false);

  if (sessionsEmpty) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <p>Your dashboard will appear here once you log a session.</p>
          <Link href="/log" className={buttonVariants()}>
            Log your first session
          </Link>
        </CardContent>
      </Card>
    );
  }

  const avgWinLoss =
    s.avgWin && s.avgLoss ? `${(s.avgWin / Math.abs(s.avgLoss)).toFixed(2)}:1` : "N/A";

  const timeProfitabilitySetupData = s.winRateBySetup.map((d) => ({
    label: d.setup,
    value: d.winRate,
  }));

  const timeProfitabilityHourData = s.pnlByHour.map((d) => ({
    label: `${d.hour}:00`,
    value: d.pnl,
  }));

  const timeProfitabilityDayData = s.pnlByDayOfWeek.map((d) => ({
    label: d.label,
    value: d.pnl,
  }));

  return (
    <div className="grid gap-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center rounded-lg border p-0.5">
          <button
            onClick={() => setShowMoney(true)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-bold transition",
              showMoney ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            $
          </button>
          <button
            onClick={() => setShowMoney(false)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-bold transition",
              !showMoney ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            %
          </button>
        </div>
      </div>

      {/* Row 1: Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total P&L"
          value={fmt$(s.totalPnl)}
          sub={`${s.totalTrades} trades`}
          tone={s.totalPnl > 0 ? "good" : s.totalPnl < 0 ? "bad" : undefined}
          showMoney={showMoney}
        />
        <StatCard
          label="Profit Factor"
          value={String(s.profitFactor)}
          sub="Gross Profit / Gross Loss"
          tone={s.profitFactor >= 1.5 ? "good" : s.profitFactor >= 1 ? "warn" : "bad"}
        />
        <StatCard
          label="Win Rate"
          value={`${s.winRate}%`}
          sub={`${s.totalTrades} Total Trades`}
          tone={s.winRate >= 50 ? "good" : "bad"}
        />
        <StatCard
          label="Avg R:R"
          value={`${s.avgRR}:1`}
          tone={s.avgRR >= 2.5 ? "good" : "warn"}
        />
      </div>

      {/* Row 2: Calendar + side panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyCalendar pnlByDay={s.pnlByDay} avgAdh={s.avgAdh} showMoney={showMoney} />
        </div>
        <div className="flex flex-col gap-4">
          <ExpectancyGrid
            avgWin={s.avgWin}
            avgLoss={s.avgLoss}
            expectancy={s.expectancy}
            avgWinLoss={avgWinLoss}
            totalWins={s.wins}
            totalLosses={s.losses}
            showMoney={showMoney}
          />
          <BestWorstDays bestDay={s.bestDay} worstDay={s.worstDay} showMoney={showMoney} />
          <DirectionPie longs={s.longs} shorts={s.shorts} showMoney={showMoney} />
        </div>
      </div>

      {/* Row 3: Secondary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Expectancy"
          value={fmt$(s.expectancy)}
          sub="per trade"
          tone={s.expectancy > 0 ? "good" : s.expectancy < 0 ? "bad" : undefined}
          showMoney={showMoney}
        />
        <StatCard
          label="Avg win / loss"
          value={`${fmt$(s.avgWin)} / ${fmt$(s.avgLoss)}`}
          tone="info"
          showMoney={showMoney}
        />
        <StatCard
          label="Premium Setups"
          value={`${s.aPlusRate}%`}
          sub="A++ grade"
          tone="info"
        />
        <StatCard
          label="Rules Followed"
          value={`${s.avgAdh}%`}
          sub="#1 Metric"
          tone={s.avgAdh >= 80 ? "good" : s.avgAdh >= 50 ? "warn" : "bad"}
        />
      </div>

      {/* Row 4: Setup grid */}
      <SetupGrid data={s.winRateBySetup} />

      {/* Row 5: Time profitability + checklist */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TimeProfitability
          hourlyData={timeProfitabilityHourData}
          dailyData={timeProfitabilityDayData}
          setupData={timeProfitabilitySetupData}
          showMoney={showMoney}
        />
        <ChecklistFailureRate data={s.checklistFailureRate} />
      </div>

      {/* Row 6: Checklist fails (raw counts on losses) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChecklistFails data={s.checklistFailures} />
        <Card>
          <CardContent className="grid gap-2 p-5">
            <div className="text-sm font-semibold">Win rate by session</div>
            {s.winRateBySession.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="grid gap-2">
                {s.winRateBySession.map((d) => (
                  <li
                    key={d.session}
                    className="flex items-center justify-between rounded-md border bg-card p-2 text-sm"
                  >
                    <span>{d.session}</span>
                    <span className="font-bold">{d.winRate}%</span>
                    <span className="text-[11px] text-muted-foreground">{d.trades} trades</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 7: Emotion table */}
      <EmotionTable data={s.emotionVsOutcome} />
    </div>
  );
}
