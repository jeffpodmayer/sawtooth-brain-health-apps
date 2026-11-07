# Decisions

Why the app is built the way it is. Read the relevant entry before changing a
rule in CLAUDE.md.

- Add a new entry for each new decision; don't rewrite old ones.
- If a decision changes, add a new entry and mark the old one "Replaced by ADR-0XX".
- Source of truth for project decisions: `claude/assessment-app-brief.md` in the
  claude.ai project. Keep the two in step.

## ADR-001: One app, tests as plug-ins

- **Status:** Accepted · **Date:** by 2026-11-05 (naming 2026-11-06)

**Context:** The practice will add more tests over time. Each test has its own
rules, but they all share links, audio, timing, saving and the dashboard.

**Decision:**

- One repo, one app. Shared code in `src/shared/`, client screens in `src/client/`,
  dashboard in `src/dashboard/`, one self-contained folder per test in `src/tests/<test-name>/`.
- Each test exports `id`, `name`, `version` and a React component taking
  `{ sequenceId, onComplete }`. `onComplete` returns
  `{ testId, testVersion, sequenceId, startedAt, completedAt, scores, rawData }`.
- The shared layer can stop a test and collect its partial result.
- Tests save only through the `ResultStore` interface and never import Supabase.
- A client visit is called a "sequence" everywhere (table, code, dashboard), never "session".

**Consequences:**

- Adding a test means adding a folder, not changing shared code.
- Shared code never knows how a test is scored.
- Tests can run on a development page with a fake ResultStore.

## ADR-002: Supabase as the whole backend

- **Status:** Accepted · **Date:** 2026-11-05 (Rails considered 2026-11-06)

**Context:** One developer, a small budget and health data. Rails was considered
(Jeff is somewhat familiar with it). Monthly cost is about the same, but Rails
means building logins, APIs, uploads and deploys, and maintaining a server alone.

**Decision:**

- Supabase for clinician logins, Postgres, Storage, real-time and Edge Functions (Deno).
- The secret database key lives only in Edge Function secrets.
- Clients never log in and never query tables directly. Link checks, saving
  results and status checks go through Edge Functions, checked by link token.
- Clinicians read and write through row-level security.
- Every database change is a migration file (Supabase CLI).

**Consequences:**

- No server to maintain. Languages are TypeScript and SQL only.
- It's standard Postgres underneath, so data can move to another host later.
- A separate backend can be added later for heavy jobs or integrations.

## ADR-003: Ready for more than one practice

- **Status:** Accepted · **Date:** 2026-11-06

**Context:** Other clinics may use the app later. Separating practices' data is
cheap now and painful to add later.

**Decision:**

- A `practices` table, and `practice_id` on every table, with RLS keeping practices apart.
- Each clinician belongs to one practice and sees all of its clients, never another's.
- Client codes are unique within a practice; link tokens are unique across the app.
- Storage files go under `<practice_id>/`, with matching storage rules.
- The practice name on client screens comes from practice settings.
- Each practice has a list of enabled (licensed) tests.

**Consequences:**

- Nothing changes for Sawtooth's clinicians today.
- Not built yet: practice sign-up, admin roles, billing, per-practice branding.
- A larger rollout will likely need HIPAA compliance, which costs much more on Supabase.

## ADR-004: Two environments

- **Status:** Accepted · **Date:** 2026-11-05 (custom domain 2026-11-06)

**Context:** Jeff wants to practice a real setup, and clinicians need somewhere
to try the app without real data.

**Decision:**

- Supabase projects `development` and `production`.
- Branch `dev` → Cloudflare Pages preview → development. Branch `main` →
  practice subdomain → production.
- Separate keys and secrets per environment; nothing hard-coded.
- `seed.sql` (fake data) runs only on development.
- Release: test on `dev` → apply migrations to production → merge `dev` into `main`.
- The preview address is locked with Cloudflare Access.
- Production runs on a subdomain of the practice's Squarespace domain (one CNAME record).
- Optional local Supabase (Docker) after the first migrations.

**Consequences:**

- Both projects fit the free plan during development; production moves to Pro ($25/month) at launch.
- Development holds fake data only. The first real client goes through production.

## ADR-005: Clients test at home with a mouse

- **Status:** Accepted · **Date:** 2026-11-05 · Replaces the earlier tablet-and-stylus plan

**Context:** The planning meeting settled how the app is used (A1–A5).

**Decision:**

- Clients use their own computer at home, with a mouse or trackpad. No tablets,
  no stylus, no drawing: clients click.
- A clinician watches over a video call in a different browser tab. No screen sharing.
- The app reads all instructions aloud; the clinician doesn't.
- Tests run full screen in Chrome, Edge, Safari and Firefox.
- English only for now. Clients are mostly older adults.

**Consequences:**

- The prototype (drawn for tablets) needs reworking for laptop and desktop screens.
- Screen size varies, so each client's screen size is saved with results.
- Interruptions (tab closed, lost connection, computer asleep) are out of scope for now.

## ADR-006: Exact script wording, pre-generated audio

- **Status:** Accepted · **Date:** 2026-11-05

**Context:** Published norms assume the standard instructions. A voice that
differs between computers, or paraphrased wording, would make results less comparable.

**Decision:**

- Each test's `script.json` holds the official wording word for word, each line
  marked "spoken" or "action". Screen text and audio both come from it.
- Instructions are spoken and shown on screen. Errors are spoken only. Instructions can't be replayed.
- Audio is generated ahead of time with ElevenLabs (voice "Justin Time",
  `uFIXVu9mmnDZ7dTKCBTX`) by a build script that only regenerates changed lines.
  The voice service and voice ID are single settings.
- Clips are committed to git in `public/audio/<test-name>/` (the permanent copy).
- Howler.js plays them; a clip ending triggers the next step.
- Pronunciation hints change audio only.
- Free plan during development; one paid Starter month for the final audio;
  a clinician listens to every final clip.

**Consequences:**

- Any wording change is a deliberate, tested change (wording tests in Vitest).
- The client's first screen needs a click and a sound check before any audio.
- The voice is a shared library voice: check its terms before launch.

## ADR-007: Scoring as pure functions, tested first

- **Status:** Accepted · **Date:** by 2026-11-05

**Context:** Timing and scoring correctness across browsers is the top risk.
A scoring mistake changes a clinical result without anyone noticing.

**Decision:**

- Scoring is plain TypeScript functions: no React, no Supabase, no clock inside.
- Unit tests (Vitest) are written first, from each test's SPEC.md.
- Anything measured uses `performance.now()`, never `Date.now()`.
- Scores are calculated in the browser and checked again on the server from the raw log.
- The app reports raw scores only. Clinicians compare them to norms outside the app.
- Every result stores the test version.

**Consequences:**

- Scoring can be checked without a browser, and reused by Edge Functions.
- The app has no derived scores (e.g. Trail Making B minus A) and no interpretation.

## ADR-008: What's stored, and what isn't

- **Status:** Accepted · **Date:** 2026-11-05 (client history 2026-11-06)

**Context:** Clinicians need a client's full history and enough detail to look
back at a test. The app handles health information and should hold as little
identifying data as possible.

**Decision:**

- Data model: client → many sequences → many test results. Client codes are
  permanent across visits; each sequence gets its own link. Results are never overwritten.
- A link works until its sequence is completed or discontinued.
- For each completed or stopped test: scores, test version, screen size, the full
  click/answer log and the sheet as an SVG (errors and corrections marked).
- A stopped test keeps its partial score and sheet.
- Clinicians can add notes to each test; notes and actions record which clinician.
- No names, demographics (age, education, sex) or other identifying details.
  Client codes link to the clinicians' own records system.
- One form per test for now; no alternate forms.

**Consequences:**

- Clients never see results or notes.
- Downloads are CSV (one row per test) and SVG sheets. PNG/PDF are deferred.
- Whether this data still counts as protected health information is a legal question (see the launch checklist).

## ADR-009: Only clinicians end a test

- **Status:** Accepted · **Date:** 2026-11-06

**Context:** A client who gives up mid-test should be stopped by the clinician
watching, not by a button that could be clicked by accident or used to skip.

**Decision:**

- Client screens have no stop, skip or end button.
- The dashboard can end the current test (moving to the next) or the whole sequence,
  with a reason: Gave up or Interrupted (more can be added).
- The stop reaches the client's tab by Supabase real-time, with a status check
  every few seconds as a fallback for networks that block real-time.
- Between tests, a break screen lets clinician and client talk; the client clicks to continue.
- No live progress view on the dashboard.

**Consequences:**

- Each test must be able to hand over a partial result at any moment.
- Real-time for clients who don't log in needs care, so they hear only their own sequence.

## ADR-010: Test-specific choices

- **Status:** Accepted · **Date:** 2026-11-04 to 2026-11-05

**Context:** Choices that apply to one test, but change how it's built.

**Decision:**

- **SWAPS replaces SDMT** (2026-11-04). SWAPS is published as a free alternative
  with norms for ages 50+; the clinicians report the author's permission to digitize it.
  The screens use the real Form A layout and symbols.
- **Trail Making follows the page layout closely, not exactly** (2026-11-06):
  circles placed approximately as on the PDFs, portrait, by eye from the scans.
  No precise measuring. (Earlier: exact layout, which reversed a plan to use original layouts.)
- **Practice failure differs for now:** Trail Making ends automatically after
  three failed practice tries; in SWAPS the clinician decides. Revisit after the first real test.

**Consequences:**

- SWAPS is enabled per practice, since permission was given to Sawtooth.
- Trail Making's circle positions must be measured from the PDFs (roadmap 5.2).
- Trail Making's circle positions are placed by eye from the scans (roadmap 5.2).

## ADR-011: MVP scope and deferred tools

- **Status:** Accepted · **Date:** 2026-11-06

**Context:** Keep the first release small enough for one developer, without
having to rebuild later.

**Decision:**

- The MVP includes both tests, test sequences with break screens, the per-client view,
  the stop button with real-time, CSV and sheet downloads, two environments and the custom domain.
- Deferred, with when to add them back:
  - TanStack Query + Table: when the result list gets long.
  - PNG/PDF sheets: if clinicians need images for their records system.
  - Playwright + GitHub Actions: after the pilot, before adding more tests (test by hand until then).
  - Sentry: when clients test without Jeff watching.

**Consequences:**

- Costs are $0 during development; at launch, Supabase Pro ($25/month) plus $1–6 one-time for audio.
- Cross-browser testing is manual for now, so it has to be deliberate (see roadmap checks).

## ADR-012: Accessibility and client screens

- **Status:** Accepted · **Date:** 2026-11-05

**Context:** Most clients are older adults, some with vision or motor difficulties.
But changing a timed test to help someone can change what it measures.

**Decision:**

- WCAG 2.2 AA around the tests (welcome, sound check, break and end screens, dashboard).
- No accommodations inside a timed test that would change what it measures.
- Atkinson Hyperlegible; body text 18–22px; headings 36–48px; buttons 48px+ (most 56–64px).
- Colors: background #F7F6F2, text #1B2430, secondary #4A5562, accent #0F5F63,
  success tint #E3F1EE with text #0B4E51.
- No timer, countdown, help phone number or end/skip button on client screens.
  Errors are spoken, with visual cues only (no error text).

**Consequences:**

- Some clients may struggle inside a test; that's for the clinician to judge, not the app.
- Trail Making circles are generous click targets, but the layout stays as on paper.

## ADR-013: Public GitHub repo

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** The roadmap planned a private repo. Jeff chose to keep it public.
The repo holds code and docs only; client data lives in Supabase.

**Decision:**

- The GitHub repo `jeffpodmayer/sawtooth-brain-health-apps` is public.
- Secrets and client data never go in the repo (rules in CLAUDE.md are unchanged).

**Consequences:**

- The official test wording in each `script.json` and SPEC.md is publicly
  visible. Check this against the SWAPS permission and the NACC terms
  (roadmap 12.2). Making the repo private later won't remove copies already made.
- A committed secret is exposed at once: treat any leaked key as compromised
  and replace it.

## ADR-014: Merge to main at the end of each phase

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** ADR-004 sets the release order but not how often to release.
Jeff wants to avoid merging after every step.

**Decision:**

- All work and commits go on `dev`, including roadmap and doc updates.
- Merge `dev` into `main` at the end of each roadmap phase, or sooner for an
  urgent fix.
- Each merge follows the ADR-004 release order: test on `dev` → apply
  migrations to production → merge.

**Consequences:**

- `main` (and later production) can be up to a phase behind `dev`.
- Fewer releases means fewer production migrations to run, but each one
  may hold more changes, so test them on `dev` first.

## ADR-015: Theme names and button text color

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** ADR-012 lists the colors but not what to call them in code, or
what color text goes on an accent button.

**Decision:**

- Tailwind theme colors (in `src/index.css`): `page` (#F7F6F2), `ink` (#1B2430),
  `ink-muted` (#4A5562), `accent` (#0F5F63), `success-bg` (#E3F1EE),
  `success-ink` (#0B4E51). Names describe purpose, not appearance.
- Text on accent buttons is white (contrast about 7.5:1).
- Use Tailwind's built-in sizes: `text-4xl`/`text-5xl` for headings (36/48px),
  `h-12`/`h-14`/`h-16` for buttons (48/56/64px). Body text is 20px.
- Font: `@fontsource/atkinson-hyperlegible` (the original), regular and bold only.

**Consequences:**

- Screens use the theme names, never raw hex codes.
- Changing a color means editing one line in `src/index.css`.

## ADR-016: Test file location and typecheck command

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** Vitest needed a place for test files, and plain `tsc --noEmit`
checks no files in this project (the root `tsconfig.json` only links to
`tsconfig.app.json` and `tsconfig.node.json`).

**Decision:**

- Test files sit next to the code they test, named `<name>.test.ts`
  (e.g. `score.ts` and `score.test.ts`). No separate tests folder.
- `npm test` runs `vitest run` (once, no watch mode).
- `npm run typecheck` runs `tsc -b --noEmit`, which follows the links and
  checks both `src/` and `vite.config.ts`. TypeScript 6 is strict by default.

**Consequences:**

- Each test module in `src/tests/<test-name>/` holds its own scoring tests.
- `src/shared/sample.test.ts` is a placeholder; delete it once real tests exist.

## ADR-017: Supabase region and organizations

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** ADR-004 names the two Supabase projects but not where they run
or how they're grouped. Supabase bills per organization, and a project's
region can't be changed later.

**Decision:**

- Both projects are in West US (Oregon), the closest region to Winthrop and
  to clients in WA and ID. Data stays in the US.
- Each project is in its own organization: `Sawtooth Development` holds
  `development`, and `Sawtooth Production` holds `production`.
- Both organizations are on the Free plan. Only `Sawtooth Production` moves
  to Pro at launch (roadmap 12.4).
- Each project has its own generated database password, kept in Jeff's
  password manager, never in the repo or any `.env` file.
- Automatic RLS for new tables is turned on where Supabase offers it.

**Consequences:**

- Upgrading production never changes development's cost.
- Free projects pause after about a week without use. Restore them from the
  dashboard; no data is lost.
- Team members (e.g. clinicians in 8.2) are added per organization, so
  access to each environment is separate.

## ADR-018: Cloudflare Pages setup

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** Cloudflare's dashboard now creates Workers by default. Pages
has separate Production and Preview variables, which match ADR-004 directly.

**Decision:**

- A Pages project (not a Worker) named `sawtooth-assessments`.
- `main` deploys to `sawtooth-assessments.pages.dev` with Production
  variables. Only `dev` gets a preview (`dev.sawtooth-assessments.pages.dev`),
  with Preview variables pointing at the `development` Supabase project.
- Build: `npm run build`, output `dist`, Node version from `.node-version`.
- Browser variables are type Text: they are public by design.

**Consequences:**

- Other branches don't deploy. Add them under Branch control if ever needed.
- Changing a variable needs a new build to take effect (`VITE_` values are
  built in).
