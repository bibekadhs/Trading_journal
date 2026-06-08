"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { SessionInput, type SessionInputT } from "@/lib/validation";
import { draftToTradeDbFields, tradeRowToDraft } from "@/lib/serialize";
import type { DraftSession } from "@/lib/domain/types";

function isoDateOnly(d: string): Date {
  // d is "YYYY-MM-DD" — treat as a date at UTC midnight to keep
  // session.date stable regardless of viewer timezone.
  return new Date(`${d}T00:00:00.000Z`);
}

export async function listSessions(): Promise<DraftSession[]> {
  const userId = await requireUserId();
  const rows = await prisma.session.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { trades: { orderBy: { occurredAt: "asc" } } },
  });
  return rows.map((s) => ({
    id: s.id,
    date: s.date.toISOString().slice(0, 10),
    routine: s.routine as unknown as DraftSession["routine"],
    trades: s.trades.map(tradeRowToDraft),
  }));
}

export async function getSessionByDate(date: string): Promise<DraftSession | null> {
  const userId = await requireUserId();
  const row = await prisma.session.findUnique({
    where: { userId_date: { userId, date: isoDateOnly(date) } },
    include: { trades: { orderBy: { occurredAt: "asc" } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    routine: row.routine as unknown as DraftSession["routine"],
    trades: row.trades.map(tradeRowToDraft),
  };
}

export async function saveSession(input: SessionInputT) {
  const userId = await requireUserId();
  const parsed = SessionInput.parse(input);
  const date = isoDateOnly(parsed.date);

  // If editing, ensure no other session owns this date.
  if (parsed.id) {
    const existing = await prisma.session.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing && existing.id !== parsed.id) {
      throw new Error(
        "A session already exists for that date. Open it from the Journal and edit it directly.",
      );
    }
  }

  const session = await prisma.$transaction(async (tx) => {
    const upserted = parsed.id
      ? await tx.session.update({
          where: { id: parsed.id },
          data: { date, routine: parsed.routine },
        })
      : await tx.session
          .create({
            data: { userId, date, routine: parsed.routine },
          })
          .catch((err) => {
            const msg = String((err as { message?: unknown })?.message ?? "");
            if (msg.includes("Unique constraint")) {
              throw new Error(
                "A session already exists for that date. Open it from the Journal and edit it directly.",
              );
            }
            throw err;
          });

    // Replace trades wholesale (matches the single-form UX of the
    // original app). Keep ids for rows that round-trip so blob URLs
    // and createdAt timestamps stay stable.
    const incomingIds = parsed.trades.map((t) => t.id).filter((x): x is string => !!x);
    await tx.trade.deleteMany({
      where: { sessionId: upserted.id, id: { notIn: incomingIds.length ? incomingIds : ["__none__"] } },
    });
    for (const t of parsed.trades) {
      const data = draftToTradeDbFields(t);
      if (t.id) {
        await tx.trade.update({ where: { id: t.id }, data });
      } else {
        await tx.trade.create({
          data: { ...data, sessionId: upserted.id, userId },
        });
      }
    }
    return upserted;
  });

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  return { id: session.id };
}

export async function deleteSession(id: string) {
  const userId = await requireUserId();
  await prisma.session.deleteMany({ where: { id, userId } });
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}

export async function deleteTrade(tradeId: string) {
  const userId = await requireUserId();
  // Verify ownership in the delete predicate.
  await prisma.trade.deleteMany({ where: { id: tradeId, userId } });
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}
