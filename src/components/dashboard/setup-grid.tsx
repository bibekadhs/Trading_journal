import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SetupGrid({
  data,
}: {
  data: { setup: string; winRate: number; trades: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Setup win rate</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((d) => {
              const radius = 34;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (d.winRate / 100) * circumference;
              let color = "#3b82f6";
              if (d.winRate >= 60) color = "#10b981";
              else if (d.winRate < 40) color = "#f43f5e";
              else color = "#f59e0b";

              return (
                <div
                  key={d.setup}
                  className="group flex flex-col items-center rounded-md border bg-card p-4 transition hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="relative mb-3 flex h-20 w-20 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx={50}
                        cy={50}
                        r={radius}
                        fill="transparent"
                        stroke="#1f2937"
                        strokeWidth={8}
                      />
                      <circle
                        cx={50}
                        cy={50}
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={8}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-110">
                      <span className="text-[15px] font-extrabold" style={{ color }}>
                        {d.winRate}%
                      </span>
                    </div>
                  </div>
                  <span
                    className="h-7 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-2 leading-tight group-hover:text-foreground transition-colors"
                    title={d.setup}
                  >
                    {d.setup}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
