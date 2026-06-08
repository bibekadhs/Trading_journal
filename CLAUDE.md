# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A multi-user MNQ / MES futures trading journal built on an ICT-style framework (Order Blocks, FVG, Liquidity Sweeps, MSS/BOS, OTE, Power-of-3, ATH). One session per calendar day per user: pre-market routine + every trade taken, with checklist adherence, psychology review, and HTF/LTF screenshots. The dashboard turns that history into setup win-rate, hourly P&L, expectancy, checklist-failure analysis, and best/worst days.

`trading-journal.html` at the root is the original single-file prototype and the **behavior spec**. The production app is the Next.js project alongside it; when behavior is ambiguous, the HTML is the source of truth.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19, TypeScript strict)
- **Clerk** for auth (`@clerk/nextjs`) — every route except `/sign-in` and `/sign-up` is protected by `src/proxy.ts`
- **Prisma 7 + Neon Postgres** via `@prisma/adapter-neon` — pooled HTTP connection, generated client at `src/generated/prisma/`
- **Vercel Blob** for HTF/LTF screenshots (URLs stored on the Trade row)
- **Tailwind v4 + shadcn/ui** with the `base-nova` preset — base color neutral, dark mode default. Component primitives sit on `@base-ui/react`, **not** Radix.

## Common commands

```bash
npm run dev           # Next dev server (Turbopack), reads .env
npm run build         # Production build + typecheck
npm run start         # Run the production build
npm run lint          # ESLint (next/core-web-vitals)
npm run db:push       # Push schema to the database (no migration file)
npm run db:migrate    # Create + apply a dev migration
npm run db:studio     # Open Prisma Studio
```

`postinstall` runs `prisma generate` automatically, so a fresh `npm install` will regenerate the client into `src/generated/prisma`.

Environment variables required (see `.env.example`):

- `DATABASE_URL` — Neon pooled connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk app keys
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/sign-in`, `/sign-up`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token

## Architecture

### Auth boundary (`src/proxy.ts`)

This file is the *only* enforcement of the user boundary. It runs `clerkMiddleware` and calls `auth.protect()` for every request that isn't a sign-in/sign-up route. Server actions then call `requireUserId()` (`src/lib/auth.ts`) and scope every database query by `userId`. There is no separate users table — the Clerk user id is the foreign key on `Session` and `Trade`.

(Filename note: Next 16 renamed `middleware` to `proxy`. Both work, but `proxy.ts` is the current convention — don't rename it back.)

### Data model (`prisma/schema.prisma`)

Two tables, both scoped by `userId`:

- `Session` — one row per `(userId, date)` (unique). `routine` is a JSON blob (discipline + preMarket + postMarket). Cascade-deletes its trades.
- `Trade` — belongs to a Session. Scalar columns for the things we filter or aggregate on (instrument, direction, sessionWindow, occurredAt, prices, outcome). The nested shapes (`entries[]`, `exits[]`, `setup`, `checklist`, `executionReview`, `psychology`) are JSON columns — the TS types in `src/lib/domain/types.ts` are the source of truth for their shape.

Postgres enums map to TS via `src/lib/serialize.ts` because the UI uses display strings ("NY open", "Stopped early") but Postgres enums can't contain spaces (`NY_open`, `StoppedEarly`).

### Domain logic (`src/lib/domain/`)

Pure, framework-free. Ported directly from `trading-journal.html`. **Any change here must keep parity with the HTML version's behavior** — the dashboard's correctness depends on it.

- `constants.ts` — enums, `TICK_SIZE = 0.25`, `TICK_VALUE` (MNQ $0.50, MES $1.25), `CHECKLIST_DEF`.
- `types.ts` — `DraftTrade`, `DraftSession`, `Routine`, etc. (the shape of JSON blobs + form drafts).
- `empty.ts` — `emptyTrade`, `emptyRoutine`, `emptyChecklist`, `getSessionWindowFromTime` (09:30–11:00 = NY open, 13:00–15:00 = NY lunch, in viewer's local TZ).
- `metrics.ts` — `calcMetrics` (multi-leg avg entry/exit, R/RR/PnL/risk$), `calcAdherence` (0 if setup is "Gamble", else % of non-Skipped checklist items marked "Yes"), `suggestOutcome` (direction-aware avg-exit comparison with ½-tick tolerance), `calcRoutineScore`.
- `format.ts` — `fmt$`, `fmtDate`.

### Server actions (`src/app/actions/`)

- `sessions.ts` — `listSessions`, `getSessionByDate`, `saveSession` (upsert + replace trades wholesale, ids preserved when round-tripped so blob URLs stay stable; enforces unique date), `deleteSession`, `deleteTrade`. All wrap `requireUserId()` and call `revalidatePath('/journal' | '/dashboard')`.
- `upload.ts` — `uploadScreenshot(formData)` — server-side handler for screenshots. The client compresses to JPEG ≤ 1200 px (`src/components/screenshot-upload.tsx`) before posting; this action just writes to Blob storage under `screenshots/<userId>/...` and returns the URL.

Validation happens in `src/lib/validation.ts` with zod schemas (`TradeInput`, `SessionInput`). Action input is parsed before touching the DB.

### Routes

- `src/app/page.tsx` — redirects to `/dashboard`.
- `src/app/(app)/layout.tsx` — top nav (`src/components/nav.tsx`) + Sonner toaster.
- `src/app/(app)/dashboard/page.tsx` — server component, calls `listSessions` and `aggregate` (`src/lib/dashboard/aggregate.ts`), renders stat cards + bar charts + setup grid + checklist-fails list. Charts are hand-rolled SVG (`src/components/dashboard/*`), no chart library.
- `src/app/(app)/journal/page.tsx` + `journal-view.tsx` — sessions list, edit-link to `/log/[date]`, delete dialog.
- `src/app/(app)/log/page.tsx` — new session form (`SessionForm`).
- `src/app/(app)/log/[date]/page.tsx` — edit existing session by ISO date string. The form's `Date` input is disabled in edit mode because the date is the natural key.
- `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk components.

### Form architecture

`src/components/session-form.tsx` owns one `DraftSession` in local state and renders:
1. `RoutineCard` (inline in the same file).
2. A list of `TradeCard`s (`src/components/trade-card.tsx`) — one per trade, with multi-leg entries/exits, setup multi-tag, full checklist with `TriToggle`, psychology, and two `ScreenshotUpload` slots.
3. A sticky save bar at the bottom calling `saveSession`.

The form replaces all trades wholesale on save; trade ids round-trip so the server diffs by `IN (...)` and preserves rows.

Shared form primitives are in `src/components/form-bits.tsx` (`Field`, `SelectField`, `NumberInput`, `TextArea`, `TriToggle`, `MultiTag`) — reuse these instead of dropping in raw shadcn inputs.

## Conventions specific to this codebase

- **No `asChild` on Button.** The `base-nova` shadcn preset uses `@base-ui/react`, which doesn't have Radix's `asChild` slot. To make a `<Link>` look like a button, use `<Link className={buttonVariants(...)}>` — see existing usages in `nav.tsx`, `journal-view.tsx`, `dashboard/page.tsx`.
- **JSON column casts go through `unknown`.** Prisma types JSON columns as `Prisma.JsonValue`, which TS won't narrow to our domain types directly — cast as `as unknown as T`. The serializer (`src/lib/serialize.ts`) is the right place for this.
- **Session date is UTC midnight** (`new Date(\`${d}T00:00:00.000Z\`)`) so the calendar bucket is stable across timezones. The Trade's `occurredAt`, by contrast, is a local datetime carrying the actual fill time used for hour-of-day analytics.
- **Generated Prisma client import path** is `@/generated/prisma/client` (Prisma 7 emits `client.ts`, not `index.ts` — `@/generated/prisma` alone won't resolve).
- **Image domain.** Vercel Blob URLs are on `*.public.blob.vercel-storage.com` and are whitelisted in `next.config.ts`. If you switch blob stores, update this.
- **The original `trading-journal.html` and `context/` folder are reference material**, not source. Don't delete them; they encode the behavior we ported.

## Workflow guidance from `context/`

- `context/project-overview.md` is the requirements doc (filled in against the real app).
- `context/architecture.md`, `code-standards.md`, `ui-context.md`, `progress-tracker.md`, `ai-workflow-rules.md` are spec-driven-development templates — most still hold placeholder copy. If you rely on them, fill them in against the actual code rather than implementing against bracketed text.
