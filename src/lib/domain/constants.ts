// Domain constants — mirrors trading-journal.html. When this list
// changes, update src/lib/domain/types.ts and the seed forms.

export const INSTRUMENTS = ["MNQ", "MES"] as const;
export const DIRECTIONS = ["Long", "Short"] as const;
export const SESSION_WINDOWS = ["NY open", "NY lunch", "Outside session"] as const;
export const OUTCOMES = ["Win", "Loss", "Breakeven", "Stopped early", "Target hit"] as const;

// Default PRIMARY_SETUPS is intentionally empty — users build the list via
// manual input and it is persisted in localStorage per-browser.
export const PRIMARY_SETUPS: readonly string[] = [];

export const HTF_BIASES = ["Bullish", "Bearish", "Neutral/ranging"] as const;
export const HTF_TIMEFRAMES = ["1H", "4H", "Daily"] as const;
export const ENTRY_MODELS = [
  "Order Block",
  "2 Min FVG",
  "2 Min IFVG",
  "Breaker Block",
  "Mitigation Block",
  "Rejection Block",
] as const;
export const EMOTIONAL_STATES = ["Calm", "Impatient", "Fearful", "Overconfident", "Neutral"] as const;
export const WAITED_OPTIONS = ["Yes", "No", "Partially"] as const;
export const MOVED_STOP_OPTIONS = ["Yes — widened", "Yes — tightened", "No"] as const;
export const EXITED_EARLY_OPTIONS = ["Yes", "No"] as const;
export const EXITED_EARLY_WHY = ["Felt scared", "Took partials", "News", "Other"] as const;
export const SETUP_PLAN_LEVELS = ["A++", "A", "B", "C", "Gamble"] as const;
export const CHECK_STATES = ["Yes", "No", "Skipped"] as const;

export const CHECKLIST_DEF = [
  { key: "htfBiasConfirmed", label: "HTF bias confirmed (1H or higher)" },
  { key: "sessionActive", label: "Entered with proper Time zone" },
  { key: "validSetup", label: "Valid ICT Entry Module was present before entry" },
  { key: "stopBeyondStructure", label: "Stop placed beyond structure (OB low/high or swing)" },
  { key: "riskInRange", label: "Risk was as per Planning" },
] as const;

export const TICK_SIZE = 0.25;

// Dollars per tick for each instrument.
export const TICK_VALUE: Record<(typeof INSTRUMENTS)[number], number> = {
  MNQ: 0.5,
  MES: 1.25,
};

export type Instrument = (typeof INSTRUMENTS)[number];
export type Direction = (typeof DIRECTIONS)[number];
export type SessionWindow = (typeof SESSION_WINDOWS)[number];
export type Outcome = (typeof OUTCOMES)[number];
export const LIQUIDITY_OPTIONS = [
  "LTF Liquidity sweep",
  "HTF Liquidity pool sweep",
] as const;

export type LiquidityOption = (typeof LIQUIDITY_OPTIONS)[number];
export type PrimarySetup = string;
export type HtfBias = (typeof HTF_BIASES)[number];
export type HtfTimeframe = (typeof HTF_TIMEFRAMES)[number];
export type EntryModel = (typeof ENTRY_MODELS)[number];
export type EmotionalState = (typeof EMOTIONAL_STATES)[number];
export type WaitedOption = (typeof WAITED_OPTIONS)[number];
export type MovedStopOption = (typeof MOVED_STOP_OPTIONS)[number];
export type ExitedEarlyOption = (typeof EXITED_EARLY_OPTIONS)[number];
export type SetupPlanLevel = (typeof SETUP_PLAN_LEVELS)[number];
export type CheckState = (typeof CHECK_STATES)[number];
export type ChecklistKey = (typeof CHECKLIST_DEF)[number]["key"];