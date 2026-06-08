import { listSessions } from "@/app/actions/sessions";
import { aggregate } from "@/lib/dashboard/aggregate";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const sessions = await listSessions();
  const s = aggregate(sessions);

  return <DashboardClient sessionsEmpty={sessions.length === 0} s={s} />;
}
