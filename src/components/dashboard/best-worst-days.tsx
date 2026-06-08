import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt$ } from "@/lib/domain/format";
import { MaskedValue } from "./masked-value";

export function BestWorstDays({
  bestDay,
  worstDay,
  showMoney = true,
}: {
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  showMoney?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Best &amp; Worst Days</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {bestDay ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Best Day</span>
              <span className="block text-xs text-gray-400 mt-1">{bestDay.date}</span>
            </div>
            {showMoney ? (
              <span className="text-lg font-bold text-emerald-400">{fmt$(bestDay.pnl)}</span>
            ) : (
              <MaskedValue value={fmt$(bestDay.pnl)} className="text-lg font-bold text-emerald-400" />
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No best day yet.</p>
        )}
        {worstDay ? (
          <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Worst Day</span>
              <span className="block text-xs text-gray-400 mt-1">{worstDay.date}</span>
            </div>
            {showMoney ? (
              <span className="text-lg font-bold text-rose-400">{fmt$(worstDay.pnl)}</span>
            ) : (
              <MaskedValue value={fmt$(worstDay.pnl)} className="text-lg font-bold text-rose-400" />
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No worst day yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
