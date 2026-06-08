import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt$ } from "@/lib/domain/format";
import { MaskedValue } from "./masked-value";

export function ExpectancyGrid({
  avgWin,
  avgLoss,
  expectancy,
  avgWinLoss,
  totalWins,
  totalLosses,
  showMoney = true,
}: {
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  avgWinLoss: string;
  totalWins: number;
  totalLosses: number;
  showMoney?: boolean;
}) {
  const Cell = ({
    label,
    value,
    colorClass,
  }: {
    label: string;
    value: string;
    colorClass: string;
  }) => (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      {showMoney ? (
        <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
      ) : (
        <MaskedValue value={value} className={`text-lg font-bold ${colorClass}`} />
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Expectancy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Cell label="Avg Win" value={fmt$(avgWin)} colorClass="text-emerald-400" />
          <Cell label="Avg Loss" value={fmt$(avgLoss)} colorClass="text-rose-400" />
          <Cell
            label="Expectancy"
            value={fmt$(expectancy)}
            colorClass={expectancy >= 0 ? "text-blue-400" : "text-rose-400"}
          />
          <Cell label="Avg W:L" value={avgWinLoss} colorClass="text-amber-400" />
        </div>
        <div className="mt-4 flex justify-between border-t border-white/5 pt-3 text-[10px] text-gray-500">
          <span>
            {totalWins}W / {totalLosses}L
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
