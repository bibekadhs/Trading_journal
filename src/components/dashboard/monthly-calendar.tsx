"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fmt$ } from "@/lib/domain/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function MonthlyCalendar({
  pnlByDay,
  avgAdh,
  showMoney = true,
  basePath = "/",
}: {
  pnlByDay: { date: string; pnl: number }[];
  avgAdh: number;
  showMoney?: boolean;
  basePath?: string;
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDayOfWeek }).map((_, i) => null);
  const days = Array.from({ length: daysInMonth }).map((_, i) => i + 1);
  const totalCells = [...blanks, ...days];
  while (totalCells.length < 42) totalCells.push(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const pnlMap = useMemo(() => {
    const map: Record<string, number> = {};
    pnlByDay.forEach((d) => (map[d.date] = d.pnl));
    return map;
  }, [pnlByDay]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const monthData = pnlByDay.filter((d) => d.date.startsWith(monthPrefix));
  const totalPnL = monthData.reduce((s, d) => s + d.pnl, 0);
  const winDays = monthData.filter((d) => d.pnl > 0).length;
  const lossDays = monthData.filter((d) => d.pnl < 0).length;
  const breakEvenDays = monthData.filter((d) => d.pnl === 0).length;
  const totalDays = monthData.length;
  const winRate = totalDays > 0 ? Math.round((winDays / totalDays) * 100) : 0;

  const pnlColorClass = totalPnL > 0 ? "text-emerald-400" : totalPnL < 0 ? "text-rose-400" : "text-gray-400";
  const winRateColorClass = winRate >= 50 ? "text-emerald-400" : winRate < 40 ? "text-rose-400" : "text-amber-400";
  const disciplineColorClass = avgAdh >= 80 ? "text-emerald-400" : avgAdh >= 60 ? "text-amber-400" : "text-rose-400";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold tracking-wide">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1 rounded-lg border p-1">
              <button
                onClick={handlePrev}
                className="rounded p-1 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                ◀
              </button>
              <button
                onClick={handleToday}
                className="rounded px-2 py-1 text-[9px] font-bold uppercase text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="rounded p-1 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                ▶
              </button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {!showMoney && totalDays > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <div className="mb-2 text-[9px] uppercase tracking-wider text-emerald-400/70">Win Rate</div>
              <div className={`text-3xl font-extrabold ${winRateColorClass}`}>{winRate}%</div>
            </div>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-center">
              <div className="mb-2 text-[9px] uppercase tracking-wider text-blue-400/70">Discipline</div>
              <div className={`text-3xl font-extrabold ${disciplineColorClass}`}>{avgAdh}%</div>
            </div>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-4 gap-2 rounded-lg border p-3">
            <div className="text-center">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">P&amp;L</div>
              <div className={`text-sm font-bold ${pnlColorClass}`}>{fmt$(totalPnL)}</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">Win Rate</div>
              <div className={`text-sm font-bold ${winRateColorClass}`}>{winRate}%</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">Days Traded</div>
              <div className="text-sm font-bold">{totalDays}</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">W/L Days</div>
              <div className="text-sm font-bold">
                <span className="text-emerald-400">{winDays}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-rose-400">{lossDays}</span>
                {breakEvenDays > 0 && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-gray-500">{breakEvenDays}BE</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {totalCells.map((day, i) => {
            if (!day) {
              return (
                <div
                  key={`blank-${i}`}
                  className="min-h-[70px] rounded-lg border border-white/[0.02] bg-white/[0.01]"
                />
              );
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const pnl = pnlMap[dateStr];
            const hasTrade = pnl !== undefined;

            let pnlColor = "text-gray-500";
            let bgClass = "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04]";
            if (hasTrade) {
              if (pnl > 0) {
                pnlColor = "text-emerald-400";
                bgClass = "bg-emerald-500/[0.05] border-emerald-500/30 hover:bg-emerald-500/[0.1]";
              } else if (pnl < 0) {
                pnlColor = "text-rose-400";
                bgClass = "bg-rose-500/[0.05] border-rose-500/30 hover:bg-rose-500/[0.1]";
              } else {
                pnlColor = "text-gray-300";
                bgClass = "bg-gray-500/[0.05] border-gray-500/30 hover:bg-gray-500/[0.1]";
              }
            }

            const isToday = dateStr === todayStr;
            const dayContent = (
              <div
                className={cn(
                  "flex min-h-[70px] flex-col justify-between rounded-lg border p-2 transition",
                  hasTrade ? "cursor-pointer hover:ring-2 hover:ring-white/20" : "cursor-default",
                  bgClass,
                  isToday && "bg-blue-500/[0.02] ring-1 ring-blue-500/50",
                )}
              >
                <div className={cn("text-[11px] font-bold", isToday ? "text-blue-400" : "text-muted-foreground")}>
                  {day}
                </div>
                {hasTrade && (
                  <div className={cn("self-end font-mono text-[11px] font-extrabold tracking-tight", pnlColor)}>
                    {showMoney ? fmt$(pnl) : (pnl > 0 ? "WIN" : "LOSS")}
                  </div>
                )}
              </div>
            );

            return hasTrade ? (
              <Link key={day} href={`${basePath}journal?date=${dateStr}`} className="block">
                {dayContent}
              </Link>
            ) : (
              <div key={day}>{dayContent}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
