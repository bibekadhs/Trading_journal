"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { SessionInput, type SessionInputT } from "@/lib/validation";
import { draftToTradeDbFields, tradeRowToDraft } from "@/lib/serialize";
import type { DraftSession } from "@/lib/domain/types";

function isoDateOnly(d: string): Date {
  return new Date(`${d}T00:00:00.000Z`);
}

export async function listDreamSessions(): Promise<DraftSession[]> {
  const userId = await requireUserId();
  const rows = await prisma.dreamSession.findMany({
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

export async function getDreamSessionByDate(date: string): Promise<DraftSession | null> {
  const userId = await requireUserId();
  const row = await prisma.dreamSession.findUnique({
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

export async function saveDreamSession(input: SessionInputT) {
  const userId = await requireUserId();
  const parsed = SessionInput.parse(input);
  const date = isoDateOnly(parsed.date);

  if (parsed.id) {
    const existing = await prisma.dreamSession.findUnique({
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
      ? await tx.dreamSession.update({
          where: { id: parsed.id },
          data: { date, routine: parsed.routine },
        })
      : await tx.dreamSession
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

    const incomingIds = parsed.trades.map((t) => t.id).filter((x): x is string => !!x);
    await tx.dreamTrade.deleteMany({
      where: { sessionId: upserted.id, id: { notIn: incomingIds.length ? incomingIds : ["__none__"] } },
    });
    for (const t of parsed.trades) {
      const data = draftToTradeDbFields(t);
      if (t.id) {
        await tx.dreamTrade.update({ where: { id: t.id }, data });
      } else {
        await tx.dreamTrade.create({
          data: { ...data, sessionId: upserted.id, userId },
        });
      }
    }
    return upserted;
  });

  revalidatePath("/dream/journal");
  revalidatePath("/dream/dashboard");
  return { id: session.id };
}

export async function deleteDreamSession(id: string) {
  const userId = await requireUserId();
  await prisma.dreamSession.deleteMany({ where: { id, userId } });
  revalidatePath("/dream/journal");
  revalidatePath("/dream/dashboard");
}

export async function deleteDreamTrade(tradeId: string) {
  const userId = await requireUserId();
  await prisma.dreamTrade.deleteMany({ where: { id: tradeId, userId } });
  revalidatePath("/dream/journal");
  revalidatePath("/dream/dashboard");
}
