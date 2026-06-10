"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { Field, TextArea } from "@/components/form-bits";
import { TradeCard } from "@/components/trade-card";
import { emptyRoutine, emptyTrade, todayISODate } from "@/lib/domain/empty";
import { saveSession } from "@/app/actions/sessions";
import type { DraftSession, DraftTrade, Routine } from "@/lib/domain/types";

interface Props {
  initial?: DraftSession | null;
  basePath?: string;
  onSave?: (session: DraftSession) => Promise<unknown>;
}

export function SessionForm({ initial, basePath = "/", onSave }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [session, setSession] = useState<DraftSession>(
    () =>
      initial ?? {
        date: todayISODate(),
        routine: emptyRoutine(),
        trades: [emptyTrade()],
      },
  );

  function setRoutine(r: Routine) {
    setSession((s) => ({ ...s, routine: r }));
  }
  function updateTrade(i: number, t: DraftTrade) {
    setSession((s) => ({ ...s, trades: s.trades.map((x, idx) => (idx === i ? t : x)) }));
  }
  function addTrade() {
    setSession((s) => ({ ...s, trades: [...s.trades, emptyTrade()] }));
  }
  function removeTrade(i: number) {
    setSession((s) => ({
      ...s,
      trades: s.trades.length > 1 ? s.trades.filter((_, idx) => idx !== i) : s.trades,
    }));
  }

  function submit() {
    startTransition(async () => {
      try {
        if (onSave) {
          await onSave(session);
        } else {
          await saveSession(session);
        }
        toast.success("Session saved");
        router.push(`${basePath}journal`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {initial ? "Edit session" : "Log session"}
          </h1>
          <p className="text-sm text-muted-foreground">
            One session per calendar day. Routine first, then each trade.
          </p>
        </div>
        <Field label="Date" className="w-full sm:w-56">
          <Input
            type="date"
            value={session.date}
            onChange={(e) => setSession((s) => ({ ...s, date: e.target.value }))}
          />
        </Field>
      </div>

      <RoutineCard routine={session.routine} onChange={setRoutine} />

      <Separator />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trades</h2>
        <Button type="button" variant="outline" size="sm" onClick={addTrade}>
          <Plus className="size-4" /> Add trade
        </Button>
      </div>

      {session.trades.map((t, i) => (
        <TradeCard
          key={t.id ?? i}
          trade={t}
          index={i}
          sessionDate={session.date}
          onChange={(nt) => updateTrade(i, nt)}
          onRemove={() => removeTrade(i)}
        />
      ))}

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-md border bg-background/90 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.push(`${basePath}journal`)} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save session"}
        </Button>
      </div>
    </div>
  );
}

function RoutineCard({
  routine,
  onChange,
}: {
  routine: Routine;
  onChange: (r: Routine) => void;
}) {
  function setDisc<K extends keyof Routine["discipline"]>(key: K, value: Routine["discipline"][K]) {
    onChange({ ...routine, discipline: { ...routine.discipline, [key]: value } });
  }
  function setPre<K extends keyof Routine["preMarket"]>(key: K, value: Routine["preMarket"][K]) {
    onChange({ ...routine, preMarket: { ...routine.preMarket, [key]: value } });
  }
  const discChecks: [keyof Routine["discipline"] & string, string][] = [
    ["meditation", "Meditation"],
    ["workout", "Workout"],
    ["tradeJournal", "Trade journal review"],
  ];
  const preChecks: [keyof Routine["preMarket"] & string, string][] = [
    ["meditation5min", "5-min meditation"],
    ["htfAnalysis", "HTF analysis"],
    ["markLevels", "Marked levels"],
    ["tradePlan", "Wrote trade plan"],
    ["newsCheck", "Checked news"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily routine</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Discipline</h4>
          <div className="flex flex-wrap gap-3">
            {discChecks.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={routine.discipline[k] as boolean}
                  onCheckedChange={(v) => setDisc(k, Boolean(v) as Routine["discipline"][typeof k])}
                />
                {label}
              </label>
            ))}
          </div>
          <Field label="Journal notes">
            <TextArea
              value={routine.discipline.tradeJournalNotes}
              onChange={(v) => setDisc("tradeJournalNotes", v)}
            />
          </Field>
        </div>

        <div className="grid gap-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pre-market</h4>
          <div className="flex flex-wrap gap-3">
            {preChecks.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={routine.preMarket[k] as boolean}
                  onCheckedChange={(v) => setPre(k, Boolean(v) as Routine["preMarket"][typeof k])}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <Field label="State of mind">
              <Input
                value={routine.preMarket.stateOfMind}
                onChange={(e) => setPre("stateOfMind", e.target.value)}
                placeholder="e.g. focused, calm"
              />
            </Field>
            <Field label="Market context and Trade Plan">
              <TextArea
                value={routine.preMarket.preMarketNotes}
                onChange={(v) => setPre("preMarketNotes", v)}
                rows={2}
              />
            </Field>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
