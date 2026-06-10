import { SessionForm } from "@/components/session-form";
import { saveDreamSession } from "@/app/actions/dream-sessions";

export default function DreamLogPage() {
  return <SessionForm basePath="/dream/" onSave={saveDreamSession} />;
}
