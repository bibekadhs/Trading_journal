import { notFound } from "next/navigation";
import { SessionForm } from "@/components/session-form";
import { getSessionByDate } from "@/app/actions/sessions";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const session = await getSessionByDate(date);
  if (!session) notFound();
  return <SessionForm initial={session} />;
}
