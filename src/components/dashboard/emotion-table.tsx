import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OUTCOMES } from "@/lib/domain/constants";

export function EmotionTable({
  data,
}: {
  data: Record<string, Record<string, number>>;
}) {
  const emotions = Object.keys(data);
  const outcomes = [...OUTCOMES];
  const colors: Record<string, string> = {
    Win: "text-emerald-400",
    "Target hit": "text-emerald-300",
    Breakeven: "text-amber-400",
    "Stopped early": "text-amber-300",
    Loss: "text-rose-400",
  };

  if (emotions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emotional State vs Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No emotional state data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Emotional State vs Outcome</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Emotion</th>
              {outcomes.map((o) => (
                <th key={o} className="px-3 py-2 text-center font-medium">
                  {o}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emotions.map((emotion) => (
              <tr key={emotion} className="border-t hover:bg-muted/50">
                <td className="px-4 py-2 font-medium">{emotion}</td>
                {outcomes.map((o) => (
                  <td key={o} className={`px-3 py-2 text-center ${colors[o] || ""}`}>
                    {data[emotion][o] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
