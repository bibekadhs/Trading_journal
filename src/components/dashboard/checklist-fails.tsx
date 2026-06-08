import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChecklistFails({
  data,
}: {
  data: { key: string; label: string; failsOnLoss: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Checklist items skipped on losing trades</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No losing trades with skipped items yet.</p>
        ) : (
          <ul className="grid gap-2">
            {data.map((d) => (
              <li
                key={d.key}
                className="flex items-center justify-between rounded-md border bg-card p-2 text-sm"
              >
                <span>{d.label}</span>
                <span className="font-bold text-rose-400">{d.failsOnLoss}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
