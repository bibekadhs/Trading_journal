import { listDreamSessions } from "@/app/actions/dream-sessions";
import { aggregate } from "@/lib/dashboard/aggregate";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DreamDashboardPage() {
  const sessions = await listDreamSessions();
  const s = aggregate(sessions);

  return <DashboardClient sessionsEmpty={sessions.length === 0} s={s} basePath="/dream/" />;
}
