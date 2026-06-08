import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt$ } from "@/lib/domain/format";
import { MaskedValue } from "./masked-value";
import type { DirectionBreakdown } from "@/lib/dashboard/aggregate";

export function DirectionPie({
  longs,
  shorts,
  showMoney = true,
}: {
  longs: DirectionBreakdown;
  shorts: DirectionBreakdown;
  showMoney?: boolean;
}) {
  const total = longs.trades + shorts.trades;
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Direction Edge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No data yet.</p>
        </CardContent>
      </Card>
    );
  }

  const longPct = longs.trades / total;
  const shortPct = shorts.trades / total;

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 50;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  const gap = longs.trades > 0 && shorts.trades > 0 ? 4 : 0;
  const longDash = longPct * circumference - gap;
  const shortDash = shortPct * circumference - gap;

  const colorLong = "#3b82f6";
  const colorShort = "#f59e0b";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Direction Edge</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-6">
          <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} />
              {longs.trades > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={colorLong}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${Math.max(0, longDash)} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />
              )}
              {shorts.trades > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={colorShort}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${Math.max(0, shortDash)} ${circumference}`}
                  strokeDashoffset={-(longPct * circumference)}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trades
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorLong }} />
                  <span className="text-sm font-semibold">Longs</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {longs.trades} ({Math.round(longPct * 100)}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span className="ml-[22px]">{longs.winRate}% Win</span>
                {showMoney ? (
                  <span className={longs.pnl >= 0 ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                    {fmt$(longs.pnl)}
                  </span>
                ) : (
                  <MaskedValue
                    value={fmt$(longs.pnl)}
                    className={longs.pnl >= 0 ? "font-bold text-emerald-400" : "font-bold text-rose-400"}
                  />
                )}
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorShort }} />
                  <span className="text-sm font-semibold">Shorts</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {shorts.trades} ({Math.round(shortPct * 100)}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span className="ml-[22px]">{shorts.winRate}% Win</span>
                {showMoney ? (
                  <span className={shorts.pnl >= 0 ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                    {fmt$(shorts.pnl)}
                  </span>
                ) : (
                  <MaskedValue
                    value={fmt$(shorts.pnl)}
                    className={shorts.pnl >= 0 ? "font-bold text-emerald-400" : "font-bold text-rose-400"}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
