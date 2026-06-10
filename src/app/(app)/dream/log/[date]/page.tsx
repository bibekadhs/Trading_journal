import { notFound } from "next/navigation";
import { SessionForm } from "@/components/session-form";
import { getDreamSessionByDate, saveDreamSession } from "@/app/actions/dream-sessions";

export default async function EditDreamSessionPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await getDreamSessionByDate(date);
  if (!session) notFound();
  return <SessionForm initial={session} basePath="/dream/" onSave={saveDreamSession} />;
}
