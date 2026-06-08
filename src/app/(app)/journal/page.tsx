import { JournalView } from "@/components/journal-view";
import { listSessions } from "@/app/actions/sessions";

export default async function JournalPage() {
  const sessions = await listSessions();
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
      <JournalView sessions={sessions} />
    </div>
  );
}
