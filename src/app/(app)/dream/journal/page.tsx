import { JournalView } from "@/components/journal-view";
import { listDreamSessions } from "@/app/actions/dream-sessions";

export default async function DreamJournalPage() {
  const sessions = await listDreamSessions();
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Dream Journal</h1>
      <JournalView sessions={sessions} basePath="/dream/" />
    </div>
  );
}
