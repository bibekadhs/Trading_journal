import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Datum {
  label: string;
  value: number;
}

export function BarChart({
  title,
  data,
  empty = "No data yet.",
}: {
  title: string;
  data: Datum[];
  empty?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          <Chart data={data} />
        )}
      </CardContent>
    </Card>
  );
}

function Chart({ data }: { data: Datum[] }) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 0.01);
  const h = 180,
    bw = 28,
    gap = 16;
  const w = Math.max(320, data.length * (bw + gap) + gap);
  return (
    <svg viewBox={`0 0 ${w} ${h + 40}`} className="w-full">
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#334155" strokeWidth={1} />
      {data.map((d, i) => {
        const x = gap + i * (bw + gap);
        const bh = (Math.abs(d.value) / max) * (h / 2 - 10);
        const y = d.value >= 0 ? h / 2 - bh : h / 2;
        const col = d.value >= 0 ? "#10b981" : "#f43f5e";
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={col} rx={2} />
            <text
              x={x + bw / 2}
              y={d.value >= 0 ? y - 5 : y + bh + 12}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={10}
            >
              {Math.round(d.value)}
            </text>
            <text x={x + bw / 2} y={h + 18} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
