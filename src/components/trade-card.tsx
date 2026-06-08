"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import {
  Field,
  SelectField,
  NumberInput,
  TextArea,
  TriToggle,
  SetupSelect,
} from "@/components/form-bits";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import {
  CHECKLIST_DEF,
  DIRECTIONS,
  EMOTIONAL_STATES,
  ENTRY_MODELS,
  EXITED_EARLY_OPTIONS,
  EXITED_EARLY_WHY,
  HTF_BIASES,
  HTF_TIMEFRAMES,
  INSTRUMENTS,
  LIQUIDITY_OPTIONS,
  MOVED_STOP_OPTIONS,
  OUTCOMES,
  SESSION_WINDOWS,
  SETUP_PLAN_LEVELS,
  WAITED_OPTIONS,
} from "@/lib/domain/constants";
import { calcAdherence, calcMetrics, suggestOutcome } from "@/lib/domain/metrics";
import { fmt$ } from "@/lib/domain/format";
import type { DraftTrade, Leg } from "@/lib/domain/types";

interface Props {
  trade: DraftTrade;
  index: number;
  sessionDate: string;
  onChange: (t: DraftTrade) => void;
  onRemove: () => void;
}

export function TradeCard({ trade, index, sessionDate, onChange, onRemove }: Props) {
  // Auto-sync trade date to session date
  useEffect(() => {
    if (trade.occurredAt.slice(0, 10) !== sessionDate) {
      const time = trade.occurredAt.slice(10) || "T00:00";
      onChange({ ...trade, occurredAt: sessionDate + time });
    }
  }, [sessionDate]);

  const metrics = calcMetrics(trade);
  const adherence = calcAdherence(trade);
  const suggested = suggestOutcome(trade);
  const qtyMismatch = metrics.totalEntryContracts > 0 && metrics.totalExitContracts > 0 && metrics.totalEntryContracts !== metrics.totalExitContracts;

  // Auto-set outcome from P&L
  useEffect(() => {
    if (trade.outcome !== suggested) {
      set("outcome", suggested);
    }
  }, [suggested]);

  // Auto-set HTF bias from direction
  useEffect(() => {
    const expected = trade.direction === "Long" ? "Bullish" : trade.direction === "Short" ? "Bearish" : trade.setup.htfBias;
    if (trade.setup.htfBias !== expected) {
      setSetup("htfBias", expected as DraftTrade["setup"]["htfBias"]);
    }
  }, [trade.direction]);



  function set<K extends keyof DraftTrade>(key: K, value: DraftTrade[K]) {
    onChange({ ...trade, [key]: value });
  }
  function setSetup<K extends keyof DraftTrade["setup"]>(key: K, value: DraftTrade["setup"][K]) {
    onChange({ ...trade, setup: { ...trade.setup, [key]: value } });
  }
  function setPsy<K extends keyof DraftTrade["psychology"]>(
    key: K,
    value: DraftTrade["psychology"][K],
  ) {
    onChange({ ...trade, psychology: { ...trade.psychology, [key]: value } });
  }
  function updateLeg(side: "entries" | "exits", i: number, leg: Leg) {
    const arr = [...trade[side]];
    arr[i] = leg;
    onChange({ ...trade, [side]: arr });
  }
  function addLeg(side: "entries" | "exits") {
    onChange({ ...trade, [side]: [...trade[side], { time: "", price: "", contracts: 1 }] });
  }
  function removeLeg(side: "entries" | "exits", i: number) {
    const arr = trade[side].filter((_, idx) => idx !== i);
    onChange({ ...trade, [side]: arr.length ? arr : [{ time: "", price: "", contracts: 1 }] });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Trade {index + 1}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4" /> Remove
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="R (risk ticks)" value={String(metrics.rt)} />
          <Stat label="Reward ticks" value={String(metrics.rwt)} />
          <Stat label="R:R" value={`${metrics.rr}`} />
          <Stat
            label="P&L"
            value={fmt$(metrics.pnl)}
            tone={metrics.pnl > 0 ? "good" : metrics.pnl < 0 ? "bad" : undefined}
          />
          <Stat label="Adherence" value={`${adherence}%`} tone={adherence >= 80 ? "good" : adherence < 50 ? "bad" : "warn"} />
        </div>

        {/* Meta */}
        <Section title="Trade meta">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="Date">
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                {new Date(`${sessionDate}T12:00:00`).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </Field>
            <Field label="Instrument">
              <SelectField value={trade.instrument} onChange={(v) => set("instrument", v)} options={INSTRUMENTS} />
            </Field>
            <Field label="Direction">
              <SelectField value={trade.direction} onChange={(v) => set("direction", v)} options={DIRECTIONS} />
            </Field>
            <Field label="Session">
              <SelectField value={trade.sessionWindow} onChange={(v) => set("sessionWindow", v)} options={SESSION_WINDOWS} />
            </Field>
          </div>
        </Section>

        {/* Entries + exits */}
        <Section title="Entries">
          <LegRows
            legs={trade.entries}
            onChange={(i, l) => updateLeg("entries", i, l)}
            onAdd={() => addLeg("entries")}
            onRemove={(i) => removeLeg("entries", i)}
          />
        </Section>
        <Section title="Exits">
          <LegRows
            legs={trade.exits}
            onChange={(i, l) => updateLeg("exits", i, l)}
            onAdd={() => addLeg("exits")}
            onRemove={(i) => removeLeg("exits", i)}
          />
          {qtyMismatch && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" />
              <span>Quantity mismatch: Entries ({metrics.totalEntryContracts}) ≠ Exits ({metrics.totalExitContracts})</span>
            </div>
          )}
        </Section>

        {/* Risk + outcome */}
        <Section title="Risk & outcome">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Stop">
              <NumberInput value={trade.stopPrice} onChange={(v) => set("stopPrice", v)} />
            </Field>
            <Field label="Target">
              <NumberInput value={trade.targetPrice} onChange={(v) => set("targetPrice", v)} />
            </Field>
            <Field label="Default contracts">
              <NumberInput step="1" value={trade.contracts} onChange={(v) => set("contracts", Math.max(1, Number(v) || 1))} />
            </Field>
            <Field label="Outcome (auto)">
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                {trade.outcome}
              </div>
            </Field>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Calculated Risk</div>
            <div className={`text-lg font-bold ${metrics.risk$ > 0 ? "text-emerald-500" : ""}`}>
              {fmt$(metrics.risk$)}
            </div>
          </div>
        </Section>

        {/* Setup */}
        <Section title="Setup">
          <Field label="Primary setup (select one)">
            <SetupSelect value={trade.setup.primary} onChange={(v) => setSetup("primary", v)} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="HTF bias">
              <SelectField value={trade.setup.htfBias} onChange={(v) => setSetup("htfBias", v)} options={HTF_BIASES} />
            </Field>
            <Field label="HTF timeframe">
              <SelectField value={trade.setup.htfTimeframe} onChange={(v) => setSetup("htfTimeframe", v)} options={HTF_TIMEFRAMES} />
            </Field>
            <Field label="Entry Module">
              <SelectField value={trade.setup.entryModel} onChange={(v) => setSetup("entryModel", v)} options={ENTRY_MODELS} />
            </Field>
          </div>
          <Field label="Took liquidity before entry">
            <SelectField
              value={trade.setup.tookLiquidityBeforeEntry || "None"}
              onChange={(v) => setSetup("tookLiquidityBeforeEntry", v === "None" ? "" : v)}
              options={["None", ...LIQUIDITY_OPTIONS]}
            />
          </Field>
        </Section>

        {/* Checklist */}
        <Section title="Pre-trade checklist">
          <div className="grid gap-2">
            {CHECKLIST_DEF.map((item) => (
              <div key={item.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_240px]">
                <span className="text-sm">{item.label}</span>
                <TriToggle
                  value={trade.checklist[item.key]}
                  onChange={(v) => onChange({ ...trade, checklist: { ...trade.checklist, [item.key]: v } })}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Psychology */}
        <Section title="Execution & psychology">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Setup plan level">
              <SelectField value={trade.psychology.setupPlanLevel} onChange={(v) => setPsy("setupPlanLevel", v)} options={SETUP_PLAN_LEVELS} />
            </Field>
            <Field label="Waited for setup">
              <SelectField value={trade.psychology.waitedForSetup} onChange={(v) => setPsy("waitedForSetup", v)} options={WAITED_OPTIONS} />
            </Field>
            <Field label="Moved stop">
              <SelectField value={trade.psychology.movedStop} onChange={(v) => setPsy("movedStop", v)} options={MOVED_STOP_OPTIONS} />
            </Field>
            <Field label="Exited early">
              <SelectField value={trade.psychology.exitedEarly} onChange={(v) => setPsy("exitedEarly", v)} options={EXITED_EARLY_OPTIONS} />
            </Field>
            {trade.psychology.exitedEarly === "Yes" && (
              <Field label="Why?">
                <SelectField
                  value={(trade.psychology.exitedEarlyWhy || "Felt scared") as (typeof EXITED_EARLY_WHY)[number]}
                  onChange={(v) => setPsy("exitedEarlyWhy", v)}
                  options={EXITED_EARLY_WHY}
                />
              </Field>
            )}
            <Field label="Emotional state">
              <SelectField
                value={(trade.executionReview.emotionalState ?? "Neutral") as (typeof EMOTIONAL_STATES)[number]}
                onChange={(v) =>
                  onChange({ ...trade, executionReview: { ...trade.executionReview, emotionalState: v } })
                }
                options={EMOTIONAL_STATES}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="What did I do right?">
              <TextArea
                value={trade.psychology.whatDidIRight}
                onChange={(v) => setPsy("whatDidIRight", v)}
                placeholder="What went well in this trade"
              />
            </Field>
            <Field label="What did I do wrong?">
              <TextArea
                value={trade.psychology.whatDidIWrong}
                onChange={(v) => setPsy("whatDidIWrong", v)}
                placeholder="What to improve next time"
              />
            </Field>
          </div>
        </Section>

        {/* Screenshots */}
        <Section title="Screenshots">
          <div className="grid gap-4 sm:grid-cols-2">
            <ScreenshotUpload label="HTF" value={trade.htfUrl} onChange={(url) => set("htfUrl", url)} />
            <ScreenshotUpload label="LTF" value={trade.ltfUrl} onChange={(url) => set("ltfUrl", url)} />
          </div>
        </Section>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
        <Separator className="flex-1" />
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "warn"
          ? "text-amber-400"
          : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function LegRows({
  legs,
  onChange,
  onAdd,
  onRemove,
}: {
  legs: Leg[];
  onChange: (i: number, leg: Leg) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="grid gap-2">
      {legs.map((leg, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_120px_40px] gap-2">
          <Input
            type="time"
            value={leg.time}
            onChange={(e) => onChange(i, { ...leg, time: e.target.value })}
            placeholder="Time"
          />
          <NumberInput value={leg.price} onChange={(v) => onChange(i, { ...leg, price: v })} placeholder="Price" />
          <NumberInput
            step="1"
            value={leg.contracts}
            onChange={(v) => onChange(i, { ...leg, contracts: Math.max(0, Number(v) || 0) })}
            placeholder="Contracts"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(i)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd} className="w-fit">
        <Plus className="size-4" /> Add leg
      </Button>
    </div>
  );
}
