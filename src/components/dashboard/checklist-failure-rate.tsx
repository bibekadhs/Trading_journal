import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChecklistFailureRate({
  data,
}: {
  data: { key: string; label: string; rate: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Checklist Failure Rate</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <ul className="grid gap-2">
            {data.map((d) => (
              <li
                key={d.key}
                className="flex items-center justify-between rounded-md border bg-card p-2 text-sm"
              >
                <span>{d.label}</span>
                <span className="font-bold text-rose-400">{d.rate}%</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
