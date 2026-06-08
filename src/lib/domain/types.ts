import type {
  CheckState,
  ChecklistKey,
  Direction,
  EmotionalState,
  EntryModel,
  ExitedEarlyOption,
  HtfBias,
  HtfTimeframe,
  Instrument,
  MovedStopOption,
  Outcome,
  LiquidityOption,
  PrimarySetup,
  SessionWindow,
  SetupPlanLevel,
  WaitedOption,
} from "./constants";

export interface Leg {
  time: string;
  price: number | "";
  contracts: number;
}

export interface Setup {
  primary: PrimarySetup;
  htfBias: HtfBias;
  htfTimeframe: HtfTimeframe;
  entryModel: EntryModel;
  tookLiquidityBeforeEntry: "" | LiquidityOption;
}

export type Checklist = Record<ChecklistKey, CheckState>;

export interface ExecutionReview {
  emotionalState?: EmotionalState;
  notes?: string;
}

export interface Psychology {
  setupPlanLevel: SetupPlanLevel;
  waitedForSetup: WaitedOption;
  movedStop: MovedStopOption;
  exitedEarly: ExitedEarlyOption;
  exitedEarlyWhy: string;
  whatDidIRight: string;
  whatDidIWrong: string;
}

// In-form / draft trade shape. Persisted Trade rows use the same
// nested shapes for JSON columns, but with database fields for the
// scalars (see Prisma schema).
export interface DraftTrade {
  id?: string;
  occurredAt: string; // ISO local datetime
  instrument: Instrument;
  direction: Direction;
  sessionWindow: SessionWindow;
  entries: Leg[];
  exits: Leg[];
  stopPrice: number | "";
  targetPrice: number | "";
  contracts: number;
  outcome: Outcome;
  setup: Setup;
  checklist: Checklist;
  executionReview: ExecutionReview;
  psychology: Psychology;
  htfUrl: string | null;
  ltfUrl: string | null;
}

export interface RoutineDiscipline {
  meditation: boolean;
  workout: boolean;
  tradeJournal: boolean;
  tradeJournalNotes: string;
}

export interface RoutinePreMarket {
  meditation5min: boolean;
  htfAnalysis: boolean;
  markLevels: boolean;
  tradePlan: boolean;
  newsCheck: boolean;
  stateOfMind: string;
  preMarketNotes: string;
}

export interface RoutinePostMarket {
  whatDidIRight: string;
  whatDidIWrong: string;
}

export interface Routine {
  discipline: RoutineDiscipline;
  preMarket: RoutinePreMarket;
  postMarket: RoutinePostMarket;
}

export interface DraftSession {
  id?: string;
  date: string; // YYYY-MM-DD
  routine: Routine;
  trades: DraftTrade[];
}
