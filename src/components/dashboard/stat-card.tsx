import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MaskedValue } from "./masked-value";

export function StatCard({
  label,
  value,
  sub,
  tone,
  showMoney = true,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "warn" | "info";
  showMoney?: boolean;
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "warn"
          ? "text-amber-400"
          : tone === "info"
            ? "text-blue-400"
            : "text-foreground";

  const glowClass =
    tone === "good"
      ? "stat-glow-green"
      : tone === "bad"
        ? "stat-glow-red"
        : tone === "warn"
          ? "stat-glow-amber"
          : tone === "info"
            ? "stat-glow-blue"
            : "";

  return (
    <Card className={glowClass}>
      <CardContent className="flex min-h-[100px] flex-col justify-between p-5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {showMoney ? (
          <span className={cn("text-3xl font-extrabold tracking-tight", color)}>{value}</span>
        ) : (
          <MaskedValue value={value} className={cn("text-3xl font-extrabold tracking-tight", color)} />
        )}
        {sub ? <span className="text-[11px] font-medium text-muted-foreground">{sub}</span> : null}
      </CardContent>
    </Card>
  );
}
