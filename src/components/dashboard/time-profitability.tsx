"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt$ } from "@/lib/domain/format";
import { cn } from "@/lib/utils";
import { MaskedValue } from "./masked-value";

interface Datum {
  label: string;
  value: number;
}

export function TimeProfitability({
  hourlyData,
  dailyData,
  setupData,
  showMoney = true,
}: {
  hourlyData: Datum[];
  dailyData: Datum[];
  setupData: Datum[];
  showMoney?: boolean;
}) {
  const [view, setView] = useState<"setup" | "hour" | "day">("setup");
  const data = view === "hour" ? hourlyData : view === "day" ? dailyData : setupData;

  const tabs = showMoney
    ? [
        { key: "setup" as const, label: "By Setup" },
        { key: "hour" as const, label: "By Hour" },
        { key: "day" as const, label: "By Day" },
      ]
    : [{ key: "setup" as const, label: "By Setup" }];

  const title = view === "setup" ? "Win Rate by Setup" : "Time-Based Profitability";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <div className="flex rounded-lg border bg-black/40 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                  view === t.key ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">No data yet.</p>
        ) : view === "setup" ? (
          <SetupBars data={data} />
        ) : (
          <ProfitBars data={data} showMoney={showMoney} />
        )}
      </CardContent>
    </Card>
  );
}

function SetupBars({ data }: { data: Datum[] }) {
  const maxVal = 100;
  return (
    <div className="flex h-48 items-end justify-between gap-2 pb-8">
      <div className="absolute inset-x-0 bottom-8 border-b border-white/[0.04]" />
      {data.map((d, i) => {
        const hPct = Math.max((d.value / maxVal) * 100, 2);
        const color =
          d.value >= 60
            ? "from-emerald-500 to-teal-400"
            : d.value >= 40
              ? "from-amber-500 to-yellow-400"
              : "from-rose-500 to-red-400";
        const textCol =
          d.value >= 60 ? "text-emerald-400" : d.value >= 40 ? "text-amber-400" : "text-rose-400";
        return (
          <div key={i} className="group relative z-10 flex h-full w-full flex-col items-center justify-end" title={`${d.label}: ${d.value}%`}>
            <span className={`absolute -top-7 text-[10px] font-bold opacity-80 group-hover:opacity-100 ${textCol}`}>
              {d.value}%
            </span>
            <div
              className={`w-full max-w-[3rem] rounded-t-sm bg-gradient-to-t ${color} transition-all`}
              style={{ height: `${hPct}%` }}
            />
            <span className="absolute -bottom-7 max-w-[4rem] overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-bold uppercase tracking-widest text-muted-foreground" title={d.label}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProfitBars({ data, showMoney = true }: { data: Datum[]; showMoney?: boolean }) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 100);
  const roundedMax = Math.ceil(max / 100) * 100;
  const h = 180;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = Math.max(300, data.length * 50);
  const innerW = chartW - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;
  const barW = Math.min(40, innerW / data.length - 8);
  const gap = (innerW - barW * data.length) / (data.length + 1);

  const toY = (v: number) => padding.top + ((roundedMax - v) / (roundedMax * 2)) * innerH;
  const zeroY = toY(0);

  const yTicks: number[] = [];
  for (let v = -roundedMax; v <= roundedMax; v += 100) {
    if (v === 0 || Math.abs(v) >= 100) yTicks.push(v);
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${h}`} className="w-full" style={{ height: h }}>
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line
              x1={padding.left}
              y1={toY(v)}
              x2={chartW - padding.right}
              y2={toY(v)}
              stroke="#1f2937"
              strokeWidth={1}
              strokeDasharray={v === 0 ? "0" : "4,4"}
            />
            <text
              x={padding.left - 8}
              y={toY(v) + 4}
              textAnchor="end"
              fill="#64748b"
              fontSize={10}
            >
              {v === 0 ? "$0" : showMoney ? fmt$(v) : "*****"}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padding.left + gap + i * (barW + gap);
          const isPos = d.value >= 0;
          const barH = (Math.abs(d.value) / roundedMax) * (innerH / 2);
          const y = isPos ? zeroY - barH : zeroY;
          const color = isPos ? "#10b981" : "#f43f5e";
          const label = showMoney ? fmt$(d.value) : "*****";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} className="cursor-pointer transition-all hover:brightness-125" />
              <text
                x={x + barW / 2}
                y={isPos ? y - 6 : y + barH + 14}
                textAnchor="middle"
                fill={color}
                fontSize={10}
                fontWeight="bold"
              >
                {label}
              </text>
              <text x={x + barW / 2} y={h - 10} textAnchor="middle" fill="#64748b" fontSize={10}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
