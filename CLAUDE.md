# CLAUDE.md — Sawtooth Assessment App

Online cognitive assessment app for Sawtooth Brain Health Institute (Winthrop, WA;
clients in WA and ID). Clients take tests at home in a browser, using a mouse or
trackpad, while a clinician watches over a video call in another tab. Clinicians
log in to a dashboard to create test sequences and review results.

This app handles health information. Treat every change as if real client data
depends on it.

## How to work with Jeff

- One small change at a time. Show the code and explain it **before** writing it.
- Stop and ask at every decision point (naming, structure, rules, library options),
  with a recommendation.
- Claude writes all the code; Jeff reviews and approves each change before
  it is written.
- For scoring logic, migrations and row-level security, walk Jeff through
  the code line by line in plain language.
- Plain language, short answers.

## Stack

- TypeScript + React + Vite, React Router, Tailwind CSS, SVG for test drawings
- Fontsource (Atkinson Hyperlegible), screenfull, Howler.js, Papa Parse
- Supabase: auth (clinicians only), Postgres, Storage, real-time, Edge Functions (Deno)
- Vitest for tests
- ESLint for linting
- GitHub + Cloudflare Pages
- Node 24 LTS, npm

## Commands

```bash
npm run dev            # local dev server
npm run build          # production build
npm test               # Vitest (scoring + script wording)
npm run typecheck      # tsc -b --noEmit (checks src/ and vite.config.ts)
npm run lint           # ESLint
npm run audio          # build audio clips from each test's script.json
npx supabase migration new <name>      # new migration file
npx supabase db push --remote          # apply migrations to the linked project (without --remote, CLI v3 targets local Docker)
npx supabase migration list --remote   # compare local migration files with the linked project
npx supabase db reset --remote=<development-ref>   # wipe development, rebuild it and load seed.sql; deletes all logins. Development only.
npx supabase functions deploy <name>
```

Add new commands here when they are created.

## Folders

```
src/
  shared/        audio player, timing, sequence runner, ResultStore, full screen, UI pieces
  client/        client test screens (/t/<link-token>)
  dashboard/     clinician side (/dashboard)
  tests/
    <test-name>/ one self-contained module per test: CLAUDE.md, SPEC.md, script.json, code
supabase/
  migrations/    every database change, as a file
  functions/     Edge Functions
  seed.sql       fake data, development only
scripts/         audio build script
public/audio/<test-name>/   generated clips (committed to git)
docs/            ROADMAP.md, DECISIONS.md
```

## Rules

**Test wording**

- Every spoken and on-screen instruction uses the exact wording in the test's
  `script.json`, which is copied word for word from the official materials.
  Never paraphrase, shorten or "improve" it. If wording seems wrong, ask.
- On-screen text and audio both come from `script.json`. Pronunciation hints
  change audio only, never displayed text.
- Errors are spoken only. No error text on screen.

**Tests as plug-ins**

- Each test exports `id`, `name`, `version` and a React component taking
  `{ sequenceId, onComplete }`.
- `onComplete` returns `{ testId, testVersion, sequenceId, startedAt, completedAt, scores, rawData }`.
- The shared layer must be able to stop a test and collect its partial result.
- Shared code never knows how a test is scored. Test code never imports
  Supabase. All data goes through the `ResultStore` interface.

**Scoring and timing**

- Scoring is pure functions (no React, no Supabase, no clock) in plain TypeScript.
- Write the unit tests first, then the function.
- Time with `performance.now()` only, never `Date.now()`, for anything measured.
- Scores are calculated in the browser and checked again on the server.
- Store the test version with every result. Raw scores only, no interpretation.

**Data and security**

- Every table has `practice_id`, and row-level security keeps practices apart.
  Clinicians see all clients in their own practice only.
- Clients never log in and never query tables directly. Client actions go
  through Edge Functions, checked by link token.
- Secret keys live only in Edge Function secrets. The browser gets only the
  public Supabase URL and publishable key, from environment variables.
  Nothing hard-coded.
- No names, demographics or other identifying details. Clients are a client code only.
- Storage files go under `<practice_id>/`, with storage rules matching the database rules.
- Every change to the database's structure (tables, columns, indexes, policies)
  is a migration file. Never change the structure by hand. Development-only
  rows may be added in the SQL Editor (until `seed.sql`, roadmap 2.9);
  production data is added only in the launch steps (roadmap 12.6).
- Build-time keys (e.g. ElevenLabs) live only in `.env.local` on Jeff's computer,
  never with a `VITE_` prefix and never in `src/`.

**Environments**

- `dev` branch → Cloudflare preview → Supabase `development` project (fake data only).
- `main` branch → production subdomain → Supabase `production` project.
- Release (at the end of each phase): test on `dev` → code review (if code changed) → apply migrations to production → merge `dev` into `main` (fast-forward only). See ADR-020.
- `seed.sql` never runs against production.

**Accessibility**

- WCAG 2.2 AA around the tests. Users are mostly older adults.
- Atkinson Hyperlegible, body text 18–22px, buttons 48px+ tall.
- No accommodations inside a timed test that would change what it measures.
- No timer, help phone number, or end/skip button on client screens.

**Browsers**

- Must work in Chrome, Edge, Safari and Firefox, in full screen. Check Safari early,
  especially audio.

## Other docs

- `docs/ROADMAP.md`: build phases and the current step
- `docs/DECISIONS.md`: why things are the way they are (read before changing a rule above)
- `src/tests/<test-name>/SPEC.md`: what each test does and how it is scored
- `src/tests/<test-name>/script.json`: exact wording, line by line
