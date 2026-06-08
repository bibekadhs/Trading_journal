import { CHECKLIST_DEF } from "./constants";
import type {
  Checklist,
  DraftTrade,
  Routine,
} from "./types";

export function emptyChecklist(): Checklist {
  const c = {} as Checklist;
  for (const item of CHECKLIST_DEF) c[item.key] = "No";
  return c;
}

export function emptyRoutine(): Routine {
  return {
    discipline: { meditation: false, workout: false, tradeJournal: false, tradeJournalNotes: "" },
    preMarket: {
      meditation5min: false,
      htfAnalysis: false,
      markLevels: false,
      tradePlan: false,
      newsCheck: false,
      stateOfMind: "",
      preMarketNotes: "",
    },
    postMarket: { whatDidIRight: "", whatDidIWrong: "" },
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function nowLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function emptyTrade(): DraftTrade {
  return {
    occurredAt: nowLocalISO(),
    instrument: "MNQ",
    direction: "Long",
    sessionWindow: getSessionWindowFromTime(),
    entries: [{ time: "", price: "", contracts: 1 }],
    exits: [{ time: "", price: "", contracts: 1 }],
    stopPrice: "",
    targetPrice: "",
    contracts: 1,
    outcome: "Win",
    setup: {
      primary: "",
      htfBias: "Bullish",
      htfTimeframe: "1H",
      entryModel: "Order Block",
      tookLiquidityBeforeEntry: "",
    },
    checklist: emptyChecklist(),
    executionReview: {},
    psychology: {
      setupPlanLevel: "A++",
      waitedForSetup: "Yes",
      movedStop: "No",
      exitedEarly: "No",
      exitedEarlyWhy: "",
      whatDidIRight: "",
      whatDidIWrong: "",
    },
    htfUrl: null,
    ltfUrl: null,
  };
}

// NY open 09:30-11:00, NY lunch 13:00-15:00, else Outside.
// Hours are in the user's local timezone — same behavior as the
// original HTML version.
export function getSessionWindowFromTime(date: Date = new Date()) {
  const t = date.getHours() + date.getMinutes() / 60;
  if (t >= 9.5 && t < 11) return "NY open" as const;
  if (t >= 13 && t < 15) return "NY lunch" as const;
  return "Outside session" as const;
}
