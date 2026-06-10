// Maps between Prisma-stored Trade rows and the DraftTrade shape the
// UI uses. The mapping is mostly identity except for enum naming
// (Prisma can't use "NY open" / "Stopped early" — see schema enums)
// and Date <-> ISO string conversion.

import type { Trade, DreamTrade } from "@/generated/prisma/client";
import type {
  DraftTrade,
  ExecutionReview,
  Psychology,
  Setup,
  Checklist,
} from "./domain/types";
import type {
  Direction,
  Instrument,
  Outcome,
  SessionWindow,
} from "./domain/constants";

// Both Trade and DreamTrade share the same fields; use a duck-type interface
// so the mapper works for either model.
interface TradeRow {
  id: string;
  occurredAt: Date;
  instrument: string;
  direction: string;
  sessionWindow: string;
  entries: unknown;
  exits: unknown;
  stopPrice: number;
  targetPrice: number;
  contracts: number;
  outcome: string;
  setup: unknown;
  checklist: unknown;
  executionReview: unknown;
  psychology: unknown;
  htfUrl: string | null;
  ltfUrl: string | null;
}

const SESSION_DB_TO_UI: Record<string, SessionWindow> = {
  NY_open: "NY open",
  NY_lunch: "NY lunch",
  Outside: "Outside session",
};
const SESSION_UI_TO_DB: Record<SessionWindow, "NY_open" | "NY_lunch" | "Outside"> = {
  "NY open": "NY_open",
  "NY lunch": "NY_lunch",
  "Outside session": "Outside",
};

const OUTCOME_DB_TO_UI: Record<string, Outcome> = {
  Win: "Win",
  Loss: "Loss",
  Breakeven: "Breakeven",
  StoppedEarly: "Stopped early",
  TargetHit: "Target hit",
};
const OUTCOME_UI_TO_DB: Record<Outcome, "Win" | "Loss" | "Breakeven" | "StoppedEarly" | "TargetHit"> = {
  Win: "Win",
  Loss: "Loss",
  Breakeven: "Breakeven",
  "Stopped early": "StoppedEarly",
  "Target hit": "TargetHit",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function tradeRowToDraft(row: TradeRow): DraftTrade {
  const rawSetup = row.setup as unknown as Record<string, unknown>;
  // Migrate old data shapes
  const primary =
    Array.isArray(rawSetup?.primary) && rawSetup.primary.length
      ? String(rawSetup.primary[0])
      : typeof rawSetup?.primary === "string"
        ? rawSetup.primary
        : "";
  const tookLiquidityBeforeEntry =
    typeof rawSetup?.tookLiquidityBeforeEntry === "boolean"
      ? rawSetup.tookLiquidityBeforeEntry
        ? "LTF Liquidity sweep"
        : ""
      : rawSetup?.tookLiquidityBeforeEntry === "LTF Liquidity sweep" ||
          rawSetup?.tookLiquidityBeforeEntry === "HTF Liquidity pool sweep"
        ? rawSetup.tookLiquidityBeforeEntry
        : "";

  const setup: Setup = {
    primary,
    htfBias: (rawSetup?.htfBias as Setup["htfBias"]) ?? "Bullish",
    htfTimeframe: (rawSetup?.htfTimeframe as Setup["htfTimeframe"]) ?? "1H",
    entryModel: (rawSetup?.entryModel as Setup["entryModel"]) ?? "Order Block",
    tookLiquidityBeforeEntry,
  };

  const rawChecklist = row.checklist as unknown as Record<string, unknown>;
  const checklist: Checklist = {
    htfBiasConfirmed: (rawChecklist?.htfBiasConfirmed as Checklist["htfBiasConfirmed"]) ?? "No",
    sessionActive: (rawChecklist?.sessionActive as Checklist["sessionActive"]) ?? "No",
    validSetup: (rawChecklist?.validSetup as Checklist["validSetup"]) ?? "No",
    stopBeyondStructure: (rawChecklist?.stopBeyondStructure as Checklist["stopBeyondStructure"]) ?? "No",
    riskInRange: (rawChecklist?.riskInRange as Checklist["riskInRange"]) ?? "No",
  };

  return {
    id: row.id,
    occurredAt: toLocalIso(row.occurredAt),
    instrument: row.instrument as Instrument,
    direction: row.direction as Direction,
    sessionWindow: SESSION_DB_TO_UI[row.sessionWindow] ?? "Outside session",
    entries: row.entries as unknown as DraftTrade["entries"],
    exits: row.exits as unknown as DraftTrade["exits"],
    stopPrice: row.stopPrice,
    targetPrice: row.targetPrice,
    contracts: row.contracts,
    outcome: OUTCOME_DB_TO_UI[row.outcome] ?? "Win",
    setup,
    checklist,
    executionReview: row.executionReview as unknown as ExecutionReview,
    psychology: row.psychology as unknown as Psychology,
    htfUrl: row.htfUrl,
    ltfUrl: row.ltfUrl,
  };
}

export function draftToTradeDbFields(t: DraftTrade) {
  const occurredAt = new Date(t.occurredAt);
  return {
    occurredAt,
    instrument: t.instrument,
    direction: t.direction,
    sessionWindow: SESSION_UI_TO_DB[t.sessionWindow],
    entries: t.entries as unknown as object,
    exits: t.exits as unknown as object,
    stopPrice: typeof t.stopPrice === "number" ? t.stopPrice : 0,
    targetPrice: typeof t.targetPrice === "number" ? t.targetPrice : 0,
    contracts: t.contracts,
    outcome: OUTCOME_UI_TO_DB[t.outcome],
    setup: t.setup as unknown as object,
    checklist: t.checklist as unknown as object,
    executionReview: t.executionReview as unknown as object,
    psychology: t.psychology as unknown as object,
    htfUrl: t.htfUrl,
    ltfUrl: t.ltfUrl,
  };
}
