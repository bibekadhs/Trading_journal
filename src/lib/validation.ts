import { z } from "zod";
import {
  CHECK_STATES,
  DIRECTIONS,
  EMOTIONAL_STATES,
  ENTRY_MODELS,
  EXITED_EARLY_OPTIONS,
  HTF_BIASES,
  HTF_TIMEFRAMES,
  INSTRUMENTS,
  LIQUIDITY_OPTIONS,
  MOVED_STOP_OPTIONS,
  OUTCOMES,
  SESSION_WINDOWS,
  SETUP_PLAN_LEVELS,
  WAITED_OPTIONS,
} from "./domain/constants";

const Leg = z.object({
  time: z.string(),
  price: z.union([z.number(), z.literal("")]),
  contracts: z.number().min(0),
});

const Setup = z.object({
  primary: z.string(),
  htfBias: z.enum(HTF_BIASES),
  htfTimeframe: z.enum(HTF_TIMEFRAMES),
  entryModel: z.enum(ENTRY_MODELS),
  tookLiquidityBeforeEntry: z.union([z.literal(""), z.enum(LIQUIDITY_OPTIONS)]),
});

const Checklist = z.object({
  htfBiasConfirmed: z.enum(CHECK_STATES),
  sessionActive: z.enum(CHECK_STATES),
  validSetup: z.enum(CHECK_STATES),
  stopBeyondStructure: z.enum(CHECK_STATES),
  riskInRange: z.enum(CHECK_STATES),
});

const ExecutionReview = z.object({
  emotionalState: z.enum(EMOTIONAL_STATES).optional(),
  notes: z.string().optional(),
});

const Psychology = z.object({
  setupPlanLevel: z.enum(SETUP_PLAN_LEVELS),
  waitedForSetup: z.enum(WAITED_OPTIONS),
  movedStop: z.enum(MOVED_STOP_OPTIONS),
  exitedEarly: z.enum(EXITED_EARLY_OPTIONS),
  exitedEarlyWhy: z.string(),
  whatDidIRight: z.string(),
  whatDidIWrong: z.string(),
});

export const TradeInput = z.object({
  id: z.string().optional(),
  occurredAt: z.string().min(1),
  instrument: z.enum(INSTRUMENTS),
  direction: z.enum(DIRECTIONS),
  sessionWindow: z.enum(SESSION_WINDOWS),
  entries: z.array(Leg).min(1),
  exits: z.array(Leg).min(1),
  stopPrice: z.union([z.number(), z.literal("")]),
  targetPrice: z.union([z.number(), z.literal("")]),
  contracts: z.number().int().min(1),
  outcome: z.enum(OUTCOMES),
  setup: Setup,
  checklist: Checklist,
  executionReview: ExecutionReview,
  psychology: Psychology,
  htfUrl: z.string().nullable(),
  ltfUrl: z.string().nullable(),
});

const Routine = z.object({
  discipline: z.object({
    meditation: z.boolean(),
    workout: z.boolean(),
    tradeJournal: z.boolean(),
    tradeJournalNotes: z.string(),
  }),
  preMarket: z.object({
    meditation5min: z.boolean(),
    htfAnalysis: z.boolean(),
    markLevels: z.boolean(),
    tradePlan: z.boolean(),
    newsCheck: z.boolean(),
    stateOfMind: z.string(),
    preMarketNotes: z.string(),
  }),
  postMarket: z.object({
    whatDidIRight: z.string(),
    whatDidIWrong: z.string(),
  }),
});

export const SessionInput = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  routine: Routine,
  trades: z.array(TradeInput),
});

export type TradeInputT = z.infer<typeof TradeInput>;
export type SessionInputT = z.infer<typeof SessionInput>;
