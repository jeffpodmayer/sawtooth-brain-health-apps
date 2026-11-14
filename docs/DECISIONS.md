# Decisions

Why the app is built the way it is. Read the relevant entry before changing a
rule in CLAUDE.md.

- Add a new entry for each new decision; don't rewrite old ones.
- If a decision changes, add a new entry and mark the old one "Replaced by ADR-0XX".
- Source of truth for project decisions: `claude/assessment-app-brief.md` in the
  claude.ai project. Keep the two in step.

## ADR-001: One app, tests as plug-ins

- **Status:** Accepted · **Date:** by 2026-11-05 (naming 2026-11-06) · Component props extended by ADR-028 and ADR-039 · Result extended by ADR-033 · Score summary added by ADR-045 · Full scores and sheet labels added by ADR-046 · Replaced by score rows and a practice row in ADR-047

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

- **Status:** Accepted · **Date:** 2026-11-05 · Replaces the earlier tablet-and-stylus plan · Interruptions narrowed by ADR-036 · Full screen narrowed by ADR-038

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

- **Status:** Accepted · **Date:** 2026-11-05 · Development voice changed by ADR-029 · On-screen instructions changed by ADR-030

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

- **Status:** Accepted · **Date:** by 2026-11-05 · Server check detailed by ADR-040

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

- **Status:** Accepted · **Date:** 2026-11-06 · Live state and control placement changed by ADR-048 · Break screen's Continue removed by ADR-050

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

- **Status:** Accepted · **Date:** 2026-11-04 to 2026-11-05 · Trail Making practice failure changed by ADR-032 · SWAPS key spacing changed by ADR-035

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

- **Status:** Accepted · **Date:** 2026-11-05 · Narrowed for the dashboard by ADR-047

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

- **Status:** Accepted · **Date:** 2026-11-07 · Dashboard font and sizes changed by ADR-047

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

## ADR-019: Cloudflare Access on the preview

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** ADR-004 says the preview address is locked with Cloudflare Access,
but not who is let in or how it's set up. Pages previews are public by default.

**Decision:**

- Turned on from the Pages project: Settings → General → Preview access →
  Restrict previews. This made a Zero Trust Access application covering
  `*.sawtooth-assessments.pages.dev` (the `dev` preview and one-off build links).
- Production (`sawtooth-assessments.pages.dev`) is not covered and stays
  public, since clients reach it without logging in.
- One Allow policy, matching listed email addresses. Only Jeff's email is on it
  for now. Visitors sign in with a one-time code sent by email.
- Zero Trust is on the Free plan (up to 50 users). The team name,
  `sawtooth-assessments-pages`, was set automatically.
- Clinicians' emails are added to the policy at roadmap 5.12, not before.

**Consequences:**

- Anyone new who needs the preview must be added to the policy in Zero Trust.
- When the custom domain is added (Phase 11), check it's managed separately
  and the preview lock is unchanged.

## ADR-020: Code review before main, and working on dev

- **Status:** Accepted · **Date:** 2026-11-07 · Release routine extended by ADR-037

**Context:** ADR-014 sets when `dev` is merged into `main`, but not how the
merge is done, whether it's reviewed, or whether work happens on other branches.

**Decision:**

- Merges into `main` are fast-forward only (`git merge --ff-only dev`), so
  `main` and `dev` share the same history. No merge commits.
- Phase merges that change code get a code review first (e.g. `/code-review`
  on `main...dev`). Fix or accept each finding before merging. Doc-only
  merges skip the review. The first reviewed merge is the end of Phase 2.
- Work happens directly on `dev`. A branch off `dev` is used only for an
  experimental step that might be thrown away. Never branch off `main` to build.

**Consequences:**

- The release routine becomes: test on `dev` → code review → apply migrations
  to production → merge `dev` into `main`.
- Revisit branches and pull requests when another developer joins or
  automated checks (Playwright + GitHub Actions, ADR-011) are added.

## ADR-021: RLS on in every table's first migration

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** Policies are written in roadmap 2.7, but tables are created from
2.1 on. The publishable key is public, so any table without RLS can be read
by anyone. The dashboard's automatic RLS setting may differ between projects
(production was recreated in 2.1 to match ADR-017's region).

**Decision:**

- Each migration that creates a table also runs
  `alter table … enable row level security;` on it.
- Until policies exist, only the owner (dashboard, CLI, Edge Functions with
  the secret key) can read or write those tables.
- Migration files are named verb + table, e.g. `create_practices`.

**Consequences:**

- Nothing in the browser can read a table until its policy is written, so
  each table needs its policy (2.7) before the app uses it.
- RLS doesn't depend on a dashboard setting; the migrations are the record.

## ADR-022: Clinician accounts, deletes and development data

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** Supabase manages logins in `auth.users`, which the app shouldn't
change and the browser can't read. Notes and stop actions (2.6, 9.1) will
record which clinician acted, so that link must never break. ADR-002 says every
database change is a migration, but development also needs a few rows to test with.

**Decision:**

- A `clinicians` table holds what the app needs: `id` (the same as the login's
  `auth.users` id), `practice_id`, `display_name` and `created_at`. No role or
  admin flag yet; no copy of the email.
- Foreign keys block deletes (`on delete restrict`): a login can't be deleted
  while its clinician row exists, and a practice can't be deleted while it has
  clinicians. To remove someone's access, ban their login in Supabase.
- Foreign key columns get an index (Postgres doesn't add one), named
  `<table>_<column>_idx`.
- Structure changes are always migrations. Development-only rows may be added
  in the SQL Editor until `seed.sql` exists (2.9). Production data is added only
  in the launch steps (12.6).
- The development login uses email and password for now; the real sign-in
  method is chosen in 8.1.

**Consequences:**

- "Who did this" always points to a real clinician, even after they leave.
- Removing a clinician completely needs a deliberate cleanup, never one click.
- Rows added in development by hand are recreated by the seed file in 2.9.

## ADR-023: Foreign keys stay inside one practice

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** A plain foreign key only checks that a row exists, not that it
belongs to the same practice. Edge Functions use the secret key and skip RLS,
so RLS can't catch a sequence pointing at another practice's client.

**Decision:**

- A foreign key to a table that has `practice_id` includes `practice_id`:
  e.g. `foreign key (client_id, practice_id) references clients (id, practice_id)`.
- The table pointed at gets `unique (id, practice_id)`, named
  `<table>_id_practice_id_key`, so the key has something to point at.
- Plain foreign keys remain for `practices` itself and for `auth.users`.

**Consequences:**

- The database rejects cross-practice links, whatever code wrote them.
- Each new table repeats the pattern, which adds a few lines per table.

## ADR-024: Tests in a sequence and their results

- **Status:** Accepted · **Date:** 2026-11-07

**Context:** ADR-008 says a sequence has many test results, never overwritten,
each with scores, test version, screen size and the full log. A sequence also
needs to know which tests to run, in what order, before any result exists.

**Decision:**

- One table, `sequence_tests`: one row per test in a sequence, created as
  `pending` with the sequence. The result columns are filled once, when the
  test completes or is stopped. A test appears at most once per sequence;
  `position` (from 1) sets the order.
- The row's `status` is `pending`, `completed`, `stopped` or `not_given`.
  It is separate from the per-part statuses inside `scores` (e.g. `timedOut`),
  which each test's SPEC defines. A timed-out test is `completed`.
- `scores` and `raw_data` are `jsonb`, shaped by each test. The database never
  reads inside them.
- `screen_width` and `screen_height` (CSS pixels, full screen) are their own
  columns, filled by the shared layer, not the test. The plug-in contract is unchanged.
- A check requires all result fields when the test ran, and none when it didn't.
- A stopped test must have `stop_reason` and `stopped_by` (a clinician in the
  same practice). Reasons: `gave_up`, `interrupted`, `unable_to_complete`
  (the last added to ADR-009's list).
- The row points at `enabled_tests`, so a practice can only be given tests it
  has enabled, and can't un-enable a test already used (ADR-023 pattern).

**Consequences:**

- A second result for the same test (e.g. a retake after reopening a link,
  roadmap 7.1) would need a new migration.
- The Trail Making SPEC's stop reason "Alphabet check not passed (997)" is not
  allowed yet. Add it by migration once the clinicians confirm the alphabet
  pre-test plan (by roadmap 9.1 at the latest).
- Why a whole sequence was discontinued belongs on `sequences` (roadmap 9.1).

## ADR-025: Clinician notes can be edited, without history

- **Status:** Accepted · **Date:** 2026-11-08

**Context:** ADR-008 says clinicians can add notes to each test, but not whether
a note can change. Clinicians will want to fix their own notes, and a note could
contain a client's name by mistake.

**Decision:**

- A test can have many notes. A clinician can edit or delete their own (enforced in 2.7).
- Editing overwrites the earlier wording. No history is kept for the MVP.
- The author and original time can't change (database trigger).

**Consequences:**

- Unlike results (ADR-008), a note's earlier wording can't be recovered.
  Raise this in the legal review (12.1).
- A deleted note is gone for good, with no record it existed.

## ADR-026: Development seed and resets

- **Status:** Accepted · **Date:** 2026-11-08

**Context:** Roadmap 2.9 replaces the hand-made development rows with `seed.sql`.
A reset deletes every login but leaves storage buckets and files in place.

**Decision:**

- The seed creates its own logins, all fake (`@example.com`). No real email goes
  in the seed, and development sign-ins use these logins.
- The three logins share one readable password, `fake-dev-password`, committed in
  the seed. Accepted because development holds fake data only.
- The development project's id stays out of the repo. Resets name it explicitly
  (`--remote=<ref>`), so a reset can't follow the CLI's link to production.
- The two practices keep fixed ids, so sheet files stay in the right folders.
- Migrations must replay on a reset. The sheets bucket insert was changed to
  `on conflict (id) do nothing` after being applied to development, before it
  reached production.

**Consequences:**

- A reset removes any login or row added by hand, including clinicians' logins
  added in 8.2. Add anything that must survive to the seed.
- Anyone with the development project's address and publishable key could sign
  in and change fake data. Never reuse this password or seed on production.
- Once a migration has reached production, it is no longer edited.

## ADR-027: Table permissions are explicit

- **Status:** Accepted · **Date:** 2026-11-08

**Context:** Supabase's default setting gives `anon` and `authenticated` full
access to new tables, leaving RLS as the only protection. The Phase 2 code review
found the grants written in 2.7 had no effect, on either project.

**Decision:**

- `anon` has no access to any table. `authenticated` gets only the access listed
  in the migrations, which RLS then limits to the clinician's own practice.
- `service_role` (Edge Functions) keeps full access.
- New tables start closed to the browser roles. Any table the dashboard needs
  must grant it in its own migration.
- Clinicians can set only `practice_id` and `code` when adding a client.

**Consequences:**

- A forgotten grant shows up as "permission denied", not as exposed data.
- This doesn't depend on the "expose new tables" project setting, for tables
  created by migrations.

## ADR-028: How a test is stopped, and its calendar times

- **Status:** Accepted · **Date:** 2026-11-08 · A hold prop added by ADR-048

**Context:** ADR-001 gives a test the props `{ sequenceId, onComplete }` and says
the shared layer can stop a test and collect its partial result. Those two props
give the shared layer no way to ask. The contract also didn't say what format
`startedAt` and `completedAt` use.

**Decision:**

- A test also takes a `stopRequested` prop. When it turns true, the test stops
  its voice and clicks and calls `onComplete` with its partial result.
- `onComplete` is a test's only way out, whether it finished, timed out or was
  stopped. The stop reason doesn't pass through the test (ADR-024).
- `startedAt` and `completedAt` are ISO 8601 text in UTC. They are calendar
  times, so `new Date()` is allowed for them. Anything measured still uses
  `performance.now()`.
- Shared types treat `scores` and `rawData` as any object. Each test's own shapes
  live in its folder and use `type`, since an `interface` doesn't fit.

**Consequences:**

- The dates come from the client's computer clock, so a wrong clock gives a wrong
  date. Scores and timings aren't affected.
- The `ResultStore` interface isn't part of this. It's written in roadmap 5.1.

## ADR-029: Free placeholder voice during development

- **Status:** Accepted · **Date:** 2026-11-08 · Changes the development voice in ADR-006 · Placeholder voice changed by ADR-031

**Context:** ADR-006 planned the "Justin Time" library voice on the free plan
during development. ElevenLabs' docs say free accounts can't use Voice Library
voices through the API.

**Decision:**

- Development clips use a free ElevenLabs default voice, "Adam" (`pNInz6obpgDQGcFmaJgB`).
- "Justin Time" stays the planned final voice, generated in the paid month
  (roadmap 12.3).
- The service and voice ID are set in `scripts/audio-settings.ts`, committed to
  git. The API key stays in `.env.local`.

**Consequences:**

- Changing the voice is a one-line edit, but every clip must be regenerated.
- Pronunciation hints (roadmap 4.5) must be re-checked on the final voice.
- Development clips aren't final and never go to real clients.
- ElevenLabs says default voices expire on December 31, 2026. After that, regenerating development clips may need a different placeholder voice.

## ADR-030: Test instructions are voice only

- **Status:** Accepted, clinicians not yet asked · **Date:** 2026-11-08 · Changes the on-screen instructions in ADR-006 · Exception added by ADR-034

**Context:** ADR-006 says instructions are spoken and shown on screen, as the
clinicians asked in the planning meeting. Both SPECs were later written as voice
only, with arrows and highlighted boxes showing what the voice means. Roadmap 5.6
and 5.7 disagreed. The clinicians haven't answered this question yet.

**Decision:**

- Inside Trail Making and SWAPS, instructions are spoken only. No instruction or
  demo text appears on screen.
- `script.json` remains the source of the exact wording for the audio.
- Screens around the tests, such as the sound check, can still show text.

**Consequences:**

- Build Phases 5 and 6 as voice only. The question stays open in both SPECs.
- If the clinicians want text on screen, 5.7 and 6.5 change, and each screen
  needs room for it.
- A client who misses a spoken instruction has no text to fall back on, since
  instructions can't be replayed. Raise this when the clinicians are asked.

## ADR-031: Bella replaces Adam as the placeholder voice

- **Status:** Accepted · **Date:** 2026-11-08 · Changes the development voice in ADR-029

**Context:** ADR-029 chose "Adam" as the free placeholder voice for development.
Jeff preferred a different voice to hear while building.

**Decision:**

- Development clips use "Bella" (`hpp4J3VqNfWAUOO0d1Us`).
- "Justin Time" stays the planned final voice, generated in the paid month
  (roadmap 12.3).

**Consequences:**

- All 58 clips are regenerated, using about 1,900 ElevenLabs characters.
- Development clips still aren't final and never go to real clients.
- The default-voice expiry noted in ADR-029 may apply to Bella too.

## ADR-032: Only the clinician ends a Trail Making sample

- **Status:** Accepted, clinicians not yet asked · **Date:** 2026-11-08 · Changes the Trail Making practice failure rule in ADR-010

**Context:** ADR-010 ended Trail Making after three failed practice tries, and the
SPEC's working answer defined a failed try as 3 errors or 2 minutes. The NACC
instructions make this the examiner's judgment: if the participant can't complete the
sample and clearly doesn't comprehend the task, Test A isn't given and code 996 is
entered. A fixed count would also end the test for a client who understands the task
but misclicks.

**Decision:**

- A sample has no limit on errors or time, and it doesn't restart.
- Only the clinician can end a sample early, from the dashboard. That ends the whole test.
- Sample results keep `passed` and drop `tries`.

**Consequences:**

- Build 5.8 this way. The question stays open in the SPEC (questions 5 to 7), and the
  clinicians can still change it.
- Trail Making and SWAPS now work the same way for practice: the clinician decides.
- A client who can't finish stays on the sample until the clinician ends it, so this
  relies on a clinician watching (ADR-005). Revisit if clients ever test unwatched.
- Code 996 has no automatic source. Settle how a stop records it at roadmap 9.1.

## ADR-033: Sheets are their own part of a test's result

- **Status:** Accepted · **Date:** 2026-11-08 · Adds to the result in ADR-001 · Answered by ADR-041

**Context:** ADR-001's result has only `scores` and `rawData`, and both SPECs listed
the sheet under `rawData`. But a sheet is saved as its own file in Storage (ADR-008,
roadmap 7.6), and shared code must not need to look inside a test's `rawData` to find it.

**Decision:**

- A test's result also has `sheets`: each sheet's name and its full SVG text.
- Trail Making uses `partA` and `partB`, for the timed parts that ended. A test with
  no sheet to hand over returns an empty `sheets`.
- The shared layer saves each one as a file under `<practice_id>/`. Sheets are not
  stored in `raw_data`.

**Consequences:**

- SWAPS returns its sheet the same way (roadmap 6.9).
- `sequence_tests` has no column pointing to a sheet yet. How files are named, and how
  a result finds its files, is decided at roadmap 7.6 and may need a migration.

## ADR-034: SWAPS shows the form's "Demo" and "Practice" labels

- **Status:** Accepted · **Date:** 2026-11-08 · Adds an exception to ADR-030

**Context:** ADR-030 keeps instruction and demo text off the screen inside both tests.
SWAPS Form A prints "Demo" and "Practice" above the two gray boxes in row 1. Trail
Making leaves off its printed "Sample A" and "Sample B" titles.

**Decision:**

- SWAPS shows those two labels, as printed on Form A.
- They are form labels, not instructions, so they live with the page layout and not in
  `script.json`.
- This applies to SWAPS only. Trail Making stays as it is, and all other instructions
  stay voice only.

**Consequences:**

- Roadmap 6.5's "no demo text on screen" excludes these two labels.
- The labels are on screen during the timed test as well, because they are part of row 1.

## ADR-035: The SWAPS key is narrower than printed

- **Status:** Accepted · **Date:** 2026-11-08 · Adjusts the Form A layout in ADR-010

**Context:** ADR-010 says the SWAPS screens use the real Form A layout. Jeff preferred
a narrower key on screen than the one printed on the form.

**Decision:**

- The key's symbols are 75 units apart instead of the form's 90, centered over the grid,
  so each sits almost directly above one of grid columns 2 to 8.
- The symbols, their order, their numbers and the grid don't change.

**Consequences:**

- The key no longer lines up with the Form A PDF when laid over it (the 6.1 check).
- It is one more small difference from the paper form. Clinicians will see it at 6.11.
- Going back is a one-line change in `form-layout.ts`.

## ADR-036: A reopened link starts again at the first unfinished test

- **Status:** Accepted, clinicians not yet asked · **Date:** 2026-11-09 · Narrows the interruptions left out of scope by ADR-005

**Context:** ADR-005 left interruptions (tab closed, lost connection, page reload) out of
scope. The link check (roadmap 7.1) has to answer something when a client opens a link
a second time. A result is saved only when a test completes or is stopped, so an
interrupted test has nothing saved. Browsers also block sound after a reload until the
client clicks, which freezes a test that is waiting for a clip to end.

**Decision:**

- A link works while its sequence is open. The link check returns only the tests with no
  result yet, in order.
- A test that was interrupted starts again from its beginning. Finished and stopped tests
  are kept and never run again (ADR-008).
- Every load of the link starts at the welcome screen and the sound check. The app never
  puts a client straight back into a test.

**Consequences:**

- A client who restarts an interrupted test has already seen part of it, which may help
  their score. The clinician is watching and judges that. Raise it when the clinicians
  are asked.
- Nothing records that a test was started and abandoned. Add that by migration if the
  clinicians want to see it.
- Sound is always unlocked by a click before any test audio, so the blocked-sound freeze
  (Phase 4 code review) can't happen after a reload.
- No migration is needed: a second result for the same test is still not allowed (ADR-024).

## ADR-037: How Edge Functions are called and released

- **Status:** Accepted · **Date:** 2026-11-09 · Adds a step to the release routine in ADR-020 · Exception added by ADR-042

**Context:** The link check (roadmap 7.1) is the first Edge Function. The functions that
save results, upload sheets and check status will follow the same pattern.

**Decision:**

- Functions are built with Supabase's `@supabase/server` library. It checks the caller's
  key, answers CORS and supplies a database client that uses the secret key. Supabase
  gives the secret key to the function by itself, so it is never typed, copied or stored.
- A caller must send the publishable key. That key is public, so the link token is the
  real check, done in the function's own code.
- The link token travels in the request body, never in the address, and is never logged.
- Every refusal gets the same reply (`404`, `link_not_valid`), whether the token is
  unknown, badly formed or belongs to a completed or discontinued sequence.
- A reply is built by hand from named values, so a new table column can't leak into it.
- Any website may call the functions (the library's default CORS). Clients have no login
  for another site to abuse, and a caller needs a link token either way.
- Deploys use `--use-api`, so Docker isn't needed.
- Release order: test on `dev` → code review → apply migrations to production → deploy
  functions to production → merge `dev` into `main`.

**Consequences:**

- Revisit the allowed websites when the subdomain is added (roadmap 11.3).
- The client screen can't tell a finished visit from a mistyped link, so it shows one
  message for both.
- A function changed on `dev` is live on development at once, but reaches production
  only at the next release.
- The release line in CLAUDE.md gains the functions step.

## ADR-038: Leaving full screen doesn't interrupt a test

- **Status:** Accepted, clinicians not yet asked · **Date:** 2026-11-09 · Narrows full screen in ADR-005 · Return to full screen narrowed by ADR-050

**Context:** ADR-005 says tests run full screen. A client can always leave full screen, for
example with Esc, and only another click can bring it back. A message asking for that click
inside a timed part would either cost the client time or mean pausing the clock.

**Decision:**

- Nothing interrupts a test when the client leaves full screen. The test carries on at
  window size.
- Full screen comes back at the client's next click outside a test: the sound check's
  "Yes, I can hear it" and the break screen's click (roadmap 7.4).

**Consequences:**

- A client could finish a timed part at window size, with smaller circles or boxes. The
  clinician is watching and judges that. Raise it when the clinicians are asked.
- Trail Making's too-small-screen message still covers a window that gets too small.
- Leaving full screen isn't recorded. The focus log only records a hidden tab or lost focus.

## ADR-039: A test reports clips it can't download

- **Status:** Accepted · **Date:** 2026-11-09 · Adds to the component props in ADR-001 and ADR-028

**Context:** A test downloads all its clips before its first instruction. A stalled or failed
download left the client on a silent page that only a reload could fix. The test can't
recover on its own, and the "Try again" screen belongs to the shared layer.

**Decision:**

- A test also takes an `onLoadFailed` prop. It calls it if its clips fail to download, or
  haven't downloaded within 30 seconds. This happens before anything is timed.
- The shared layer then shows "Something went wrong" with "Try again", which starts the test
  again from its beginning, with a fresh download.
- The 30-second limit lives in the audio player (`readyInTime`), shared by the sound check
  and the tests.

**Consequences:**

- Every new test must call `onLoadFailed` when its clips fail, and the shared layer must
  pass a function that keeps the same identity between renders.
- A clip that downloaded but refuses to play isn't covered.
- Nothing records that a test's download failed or was retried.

## ADR-040: How a result is saved and checked

- **Status:** Accepted · **Date:** 2026-11-11 · Details the server check in ADR-007

**Context:** ADR-007 says scores are checked again on the server, and ADR-008 says results
are never overwritten. Neither says what happens when the browser's and the server's scores
disagree, or what stops a saved result from being changed later. The save-result function
(roadmap 7.5) needed answers.

**Decision:**

- save-result finds the sequence from the link token only, never from the result. It
  re-scores the raw log with each test's `scoring/rescore.ts` and saves the server's scores
  in `scores`.
- If the browser's scores differ, the result is still saved, and the browser's are kept in
  `browser_scores` as a flag. The column is empty when the two agree.
- A raw log that isn't valid (wrong shape, negative or invalid times) is rejected.
- `test_version` is stored as the browser sent it: the version that ran the test.
- SWAPS's count of wrong practice answers is taken from the browser, since no practice log
  is kept. Only its form is checked (SWAPS SPEC).
- Stopped results are refused until roadmap 9.1 records the stop's reason and clinician.
- A test's row is filled once; a second save gets `409 not_pending`. Database triggers block
  any change to a finished test or a closed sequence, by anyone, including Edge Functions and
  the SQL Editor. A test can't end before it started.

**Consequences:**

- A bug or a stale tab never loses a result or forces a retake (ADR-036). The clinician sees
  the flag in the result view (roadmap 8.7).
- On a flagged result, `scores` came from the server's scoring code, while `test_version`
  names the browser's.
- Correcting a saved result needs a deliberate migration, never a quick edit.

## ADR-041: Sheets are saved with their result, and listed on its row

- **Status:** Accepted · **Date:** 2026-11-11 · Answers the open question in ADR-033

**Decision:**

- Sheets travel in the same save-result request as the result, and are uploaded before the
  row is saved, so a saved result always has its files.
- Each file is `<practice_id>/<sequence_test_id>/<sheet name>.svg`. `sequence_tests.sheets`
  lists each sheet's name and path (`{}` when there are none).
- Only each test's own sheet names are accepted, so the browser can't choose where a file goes.

**Consequences:**

- A sheet's SVG comes from the browser and could contain script. The dashboard must show it
  only as an image or a download (roadmap 8.7).

## ADR-042: A sequence closes itself when its last test is saved

- **Status:** Accepted · **Date:** 2026-11-11 · Adds an exception to ADR-037

**Context:** Roadmap 7.8 closes a sequence when the client finishes, so its link stops working.
A separate closing step could fail after the last save and leave an open sequence with nothing
to run. Closing it with the save means a retried last save finds the sequence already closed.

**Decision:**

- A database trigger sets a sequence to `completed` once none of its tests is pending, in the
  same transaction as the save that finished the last one. A discontinued sequence is left alone.
- save-result answers a completed sequence with `409 not_pending`, like an already-saved test,
  and the client counts a 409 as saved (roadmap 7.7). Unknown and discontinued tokens still get
  the 404 refusal. check-link is unchanged.
- The end screen says "Thank you" and leaves full screen, so the client can go back to the video call.

**Consequences:**

- A saved last test and a closed link always go together.
- Through save-result, someone holding a finished link's token can tell it apart from an unknown
  token. Only the client has the token, so this is accepted.
- A sequence with stopped or not-given tests is `completed` once nothing is pending. A clinician's
  "end whole sequence" (roadmap 9.1) must set `discontinued` before marking the remaining tests
  not given.
- The end screen wording hasn't been seen by the clinicians.

## ADR-043: Clinicians sign in with email and password

- **Status:** Accepted · **Date:** 2026-11-11 · Answers the sign-in question in ADR-022 · Client screens' channel added by ADR-051

**Context:** ADR-022 left the clinicians' sign-in method to roadmap 8.1. There are three
clinicians, and their accounts are created by hand (8.2). Public sign-up was still on, so
anyone with the publishable key could make an account. RLS showed such an account nothing,
since it has no `clinicians` row.

**Decision:**

- Clinicians sign in with email and password, through Supabase Auth.
- Public sign-up is off in both projects. Accounts are made only by Jeff, in the Supabase
  dashboard.
- Passwords are at least 12 characters, with no rules about character types.
- Only dashboard code talks to Supabase from the browser, through one client in
  `src/dashboard/`. Client screens still use only the Edge Functions (ADR-037).

**Consequences:**

- Signing in never waits on an email. A password reset does, and Supabase's built-in email
  is limited to a few an hour, so a real email service is needed before launch (12.5).
- Another method (an emailed code, Google) can be added later without a database change.
- A second sign-in step (an authenticator app) isn't required yet. Ask the lawyer (12.1)
  and decide at the security review (12.5).

## ADR-044: Dashboard saves across several tables go through one database function

- **Status:** Accepted · **Date:** 2026-11-11 · Changes how roadmap 8.4 creates a sequence

**Context:** A new client and their first sequence are created together (roadmap 8.3). The
roadmap planned an Edge Function, but it would send each insert as a separate request, so a
failure partway could leave a client with no visit, or a sequence with no tests. The browser
can't run a transaction either.

**Decision:**

- The dashboard calls a Postgres function with `supabase.rpc`. It runs as one transaction:
  every row saves, or none does.
- The function runs with its owner's rights (`security definer`, empty `search_path`), so
  `sequences` and `sequence_tests` stay closed to the browser (ADR-027). Only signed-in
  clinicians can call it.
- The practice and clinician come from the sign-in (`private.current_practice_id()`,
  `auth.uid()`), never from what the browser sends.
- The function checks its own inputs, since it skips row-level security.
- First use: `create_sequence` (roadmap 8.4a). It returns the link token and whether the client
  was new.

**Consequences:**

- 8.4 has no Edge Function. The migration carries the function, so a release needs nothing extra.
- The function lives in `public` so the API can reach it. Who can run it is granted explicitly;
  `anon` gets nothing.
- Each such function must repeat the practice checks RLS would otherwise do, so it gets the same
  line-by-line walkthrough as a policy.
- The browser's insert grant on `clients` (ADR-027) is no longer used by the dashboard. It stays
  for now.
- Clients still reach the database only through Edge Functions (ADR-037).

## ADR-045: Each test summarizes its own scores for the dashboard

- **Status:** Accepted · **Date:** 2026-11-12 · Adds to the test plug-in in ADR-001 · Extended by ADR-046 · Replaced by ADR-047

**Context:** The per-client view (roadmap 8.6) shows each test's scores. Shared code must never
know how a test is scored (ADR-001), and each test's `scores` has its own shape.

**Decision:**

- Each test has a `summary.ts` with `summarizeScores(scores)`, which returns a few lines of text:
  raw numbers only, the fields its SPEC records, and whether a part timed out, was stopped or
  wasn't given. Sample and practice results are left out.
- The dashboard lists each test's summary function in `sequence-tests.ts`, next to its name, and
  only prints the lines.
- `summary.ts` treats the stored scores as its own score type. Only save-result's server scoring
  writes `scores` (ADR-040).

**Consequences:**

- A new test needs a `summary.ts` with its own unit tests, and a line in `sequence-tests.ts`.
- If a test's score shape changes in a later version, its summary must handle both shapes,
  since older results keep theirs.
- The full scores, test version and stop reason are shown in the result detail (8.7).

## ADR-046: Results show on the client page, with each test's full detail and sheets

- **Status:** Accepted · **Date:** 2026-11-12 · Removes the results list (roadmap 8.5) · Adds to the test plug-in in ADR-001 and ADR-045 · Detail pieces and layout replaced by ADR-047 · Where the CSV export lives answered by ADR-052

**Context:** Roadmap 8.5 built a results list across all clients, and 8.7 planned a page for each result.
Clinicians look at results one client at a time, so the list and a separate page added a step
without adding anything.

**Decision:**

- The dashboard has a Clients list and a page for each client. There is no results list.
- Each completed or stopped test on a client page opens its full detail: stop reason and who stopped
  it, start and finish times, test version, screen size, the browser-scores flag (ADR-040), the full
  scores and the sheets. For the MVP, a Details button opens it in place. That layout is plain on
  purpose and can change at the dashboard polish (8.9) without a new ADR.
- Each test's `summary.ts` also has `detailScores(scores)`: the summary lines plus sample or practice
  results. Raw numbers only.
- Each test's `test-info.ts` has `sheetLabels`, naming its sheets in the order shown.
- Sheets are fetched only when a test's details are opened, with signed URLs that work for 10 minutes.
  They show only as `<img>` (ADR-041). The URLs are marked as downloads, so opening one in a new tab
  downloads the file instead of showing it as a page.

**Consequences:**

- A new test needs `detailScores` (with unit tests) and `sheetLabels`, as well as `summary.ts`
  (ADR-045), and both go in `sequence-tests.ts`.
- Search by client code and the date filter went with the results list. A client-code search is
  planned for the Clients list (8.9).
- The CSV export (10.1) was planned to match the results list, so where it lives is decided at 10.1.

## ADR-047: The dashboard redesign

- **Status:** Accepted · **Date:** 2026-11-13 · Replaces the score summary in ADR-045 and the detail pieces in ADR-046 · Narrows ADR-012 and ADR-015 for the dashboard · CSV columns added and sheet download changed to PDF by ADR-052

**Context:** At roadmap 8.9, Jeff redesigned the dashboard from his own mock-ups. The client page shows each
test's parts as a table, each row with its own sheet, so each test now hands the dashboard a table instead of text lines.
Only clinicians use the dashboard.

**Decision:**

- Each test's `summary.ts` provides `scoreTable(scores)`: the test's column names and one row per part.
  Each row has a label, its values for the first columns (the first shown bold), an optional grey note
  across the columns it doesn't fill (such as "1 blank" or "Not given"), and the row's sheet name. It also
  provides `practiceRow(scores)`: the samples or practice, which aren't scored. It is kept but not shown on
  the dashboard for now. These replace `summarizeScores` (ADR-045) and `detailScores` (ADR-046).
  `sheetLabels` stays. The `ScoreTable`, `ScoreRow` and `PracticeRow` types are in
  `src/shared/test-module.ts`.
- Every test saves `rawData.browser` as `{ name, version }`. The dashboard reads only that from `raw_data`,
  never the log.
- The client page has a "Clients / <client ID>" breadcrumb, then the visits, newest first. The newest visit
  with results starts open. Visits show no status.
- Each test shows:
  - its name and status, with the stop reason, who stopped it, and its own date if it differs from the
    visit's
  - a computer icon that shows the browser and screen size on hover
  - its score table, with View and Download for each sheet. Each click gets a fresh 10-minute signed link,
    and sheets show only as images (ADR-041).
  - the corrected-scores warning, with the browser's scores inside it
  - its notes, shown like a text conversation: oldest first, the first note on the left, switching sides
    when a different clinician wrote the next one; and Add note
- Test version and start and finish times are stored but not shown.
- Notes are added, edited and deleted in dialogs. Deleting is reached from Edit and asks first.
- Open visits have Copy link. New sequence is on the Clients page and on each client page, where the client
  ID is fixed. The top bar shows the practice name, the clinician's name and Sign out.
- The dashboard says "Client ID", not "client code". The database column stays `code`.
- The dashboard has no formal accessibility pass (screen reader testing or audit). It keeps the basics:
  contrast (4.5:1 for text, 3:1 for borders), real buttons and labels, keyboard use, visible focus, and
  click targets of at least 24px (most are 48px). Client screens stay at WCAG 2.2 AA (ADR-012).
- The dashboard uses Atkinson Hyperlegible Next (variable font), loaded only with the dashboard's code,
  with semibold in place of bold. Body text is 18px, small text 16px and headings 36px. Client screens
  keep the original Atkinson Hyperlegible at 20px (ADR-015).
- New theme colors: `surface`, `line`, `field-line`, `hover`, `band`, `accent-strong`, `warning-ink`,
  `danger`, `danger-strong` and `danger-tint`.

**Consequences:**

- A new test needs `scoreTable` and `practiceRow` with unit tests, and `sheetLabels`. It must also save
  `rawData.browser`.
- If a test's score shape changes, its table must handle older results too (as in ADR-045).
- Test version and times are visible only in the database, or in the CSV export (10.1).
- The device and operating system aren't recorded. Add them to both tests if the clinicians want them.
- The clinicians haven't seen the redesign yet.

## ADR-048: The clinician starts each timed part, and controls sit on the test's row

- **Status:** Accepted · **Date:** 2026-11-13 · Changes ADR-009 (adds a small live state) and ADR-028 (a new test prop) · Where tests hold changed by ADR-050

**Context:** At the start of roadmap 9.1, Jeff changed the design: a test should wait after each
sample or practice until the clinician clicks Continue, so the clinician can check in with the
client before anything is timed. The stop controls should sit on the client page, on the row of
the test that's running, not on a page of their own.

**Decision:**

- A test holds after each sample or practice, before the real part's instructions: after Trail
  Making's Sample A and Sample B, and after SWAPS's practice. Nothing is timed during a hold.
- While holding, the finished sample stays on screen with no new text. The clinician tells the
  client to wait over the video call. Nothing is added to `script.json`.
- The client's tab reports the hold to the server, through an Edge Function checked by link token.
  The dashboard shows it on the test's row with a Continue button. Continue reaches the client's tab
  the same way a stop does (real-time, with the status check as a fallback).
- The running test is the first `pending` test in an open visit. Its row on the client page has
  Continue (only while holding) and End current test. End whole sequence sits on the open visit's
  row, next to Copy link. Both ends require a reason.
- At a hold, the clinician chooses Continue or End current test. Ending there means the client
  couldn't do the sample.
- Tests get one more prop for the hold. Its shape is settled when the tests use it (roadmap 9.5).
  Tests still never import Supabase; the shared layer passes the hold through.
- ADR-009's "no live progress view" now allows exactly this: whether the client's tab has begun the
  running test (a red glowing dot with "In progress", yellow with "Waiting for you"; steady when the computer
  asks for reduced motion),
  a counter while a timed part runs, and whether the test is holding. Nothing else is shown.
- Tests report when a timed part starts and ends, with the part's key (e.g. `partA`). Shared code passes
  the key along without reading it; each test lists its timed parts' labels for the dashboard (`timedParts`).
  The server records the times with its own clock. The counter shows in that part's row, mirroring the
  client's timer (it may lag by up to about a second), for display only, and is never used for scoring.

**Consequences:**

- A test can't move past a hold without a clinician watching on the dashboard (ADR-005). Revisit if
  clients ever test unwatched.
- The hold gives ADR-032's code 996 a natural source: ending Trail Making at the hold after a
  sample. How it's recorded is settled at 9.1.
- The development test pages need a way past a hold without the dashboard.
- Phase 9 is reshaped to carry Continue alongside Stop.

## ADR-049: How stop requests, holds and stop reasons are stored

- **Status:** Accepted · **Date:** 2026-11-13 · Builds on ADR-024, ADR-032 and ADR-048 · Hold reset on a reopened link added by ADR-053

**Context:** A clinician's stop and Continue must be saved before the client's tab acts on them
(roadmap 9.1). A `sequence_tests` row can only be `stopped` once its partial result is saved, so
there was nowhere to keep a stop that hasn't been answered yet, or a hold.

**Decision:**

- `sequence_tests` gains `stop_requested_at`, `holds_reached` and `holds_released`. No new status.
  `stop_reason` and `stopped_by` are filled when the clinician clicks.
- Holds are counts, not names, so shared code never learns a test's parts. The client's tab raises
  `holds_reached`; Continue sets `holds_released` equal to it. Holding means reached > released.
  Repeating either changes nothing.
- `sequence_tests` also gains `began_at` (the client's tab began the test), `timed_part` (the running timed
  part's key) and `timed_part_started_at` (when it started). The last two are cleared together when the part
  ends. All use the server's clock. None is part of the result.
- Clinicians act through one database function per action (ADR-044), which checks their practice.
  The client's tab writes only through Edge Functions checked by link token.
- The client's tab always answers a stop: a partial result (saved as `stopped`), or "not begun"
  (saved as `not_given`, keeping the reason and clinician). With no answer, the row stays `pending`
  with its request, and the dashboard says so. The server never guesses whether a test began.
- A full result that arrives after a stop request is saved as `stopped`, with the clinician's reason.
- End whole sequence, in one save: the visit becomes `discontinued`, the running test gets a stop
  request, and the other pending tests become `not_given`. save-result accepts a result for a test
  with a stop request even after its visit has closed.
- Stop reasons: Gave up, Interrupted and Unable to complete for every test. A test can add its own
  through its plug-in; Trail Making adds Alphabet check not passed.
- Trail Making's codes come from the reason and where the stop found the test: 996 for Unable to
  complete during a sample, its instructions or the hold after it; 997 for Alphabet check not passed.
  save-result adds them through Trail Making's own scoring code, after the browser-versus-server
  check, since the browser never knows the reason.

**Consequences:**

- A closed tab mid-test loses that test's partial result. Its row shows the unanswered stop.
- The code rule awaits the clinicians, with ADR-032 (Trail Making SPEC questions 5–9).
- Each new test-specific reason needs a migration, since the database checks the list.

## ADR-050: The clinician moves the client through every step

- **Status:** Accepted · **Date:** 2026-11-13 · Changes ADR-048 (where tests hold) and ADR-009 (the break screen's Continue) · Narrows ADR-038

**Context:** After 9.1, Jeff decided the clinician should control every step, not only the start of
each timed part, and that the Continue button should say which step comes next.

**Decision:**

- Each test holds before each of its steps, and lists those holds in order with the label the
  dashboard shows on Continue (`holds`). Trail Making: Sample A, Part A, Sample B, Part B.
  SWAPS: Introduction, Test, Recall. The button reads "▶ " and the next hold's label. The database
  still only counts holds (ADR-049), so the label is the test's list at `holds_released`.
- The break screen has no button. It keeps its wording ("Please wait for your clinician to tell
  you to continue.") while the next test waits at its first hold. The first test after the sound
  check waits the same way.
- The client's first click (welcome or sound check) stays. Browsers allow sound and full screen
  only after a click by the person at that computer, and no message from the dashboard counts.
- If the client leaves full screen, the test carries on windowed (ADR-038). Only the client can
  return to full screen; the clinician can ask them to press F11 (Windows) or Ctrl+Cmd+F (Mac),
  or click for them through the video platform's remote control.
- SWAPS's hold before Recall makes the pause before recall clinician-paced. Recall is an
  incidental-memory check, so this awaits the clinicians.

**Consequences:**

- After the first click, a client never needs to act except to take the test.
- Audio resumes after long silences without a new click. Check this in every browser, Safari
  especially (roadmap 9.5 and 10.4).
- `breakLocked` goes away: the break screen simply has no button.

## ADR-051: How the client's tab hears Stop and Continue

- **Status:** Accepted · **Date:** 2026-11-13 · Builds on ADR-002, ADR-048 and ADR-049 · Narrows ADR-043

**Context:** A clinician's stop or Continue must reach the client's tab within a second or two
(roadmap 9.3). Supabase real-time normally decides who hears what by checking a login against RLS,
but clients never log in and never read tables (ADR-002).

**Decision:**

- When a stop is requested, Continue is clicked, or the visit closes, a database trigger sends
  an empty "check now" message over real-time Broadcast. The message carries no data.
- Each visit has its own channel, named from a one-way hash (SHA-256) of its link token with a
  fixed prefix. The client's tab works out the name from the token it already has. The name can't
  be guessed and can't be turned back into the token. No column is added.
- On a message, the tab asks an Edge Function, checked by link token, for the current state
  (stop requested, Continue count). The status check (roadmap 9.4) calls the same function, so the
  answer always comes from the server, never from the message.
- The channel is public in Supabase's terms (no login). Anyone who learned its name could send a
  fake "check now", which only makes the tab ask the server early.
- The client's tab still never logs in. Anonymous sign-in was considered and rejected: it would
  change that rule and add logins to manage.
- The tab opens only a real-time connection (Supabase's real-time library on its own), never the
  Supabase client, so it still can't query tables. This narrows ADR-043: client screens use the
  Edge Functions and this one channel.

**Consequences:**

- Realtime's "Allow public access" setting must stay on in both Supabase projects.
- A visit's channel name is as private as its link token. Never log or display it.
- Real-time is only a shortcut. Without it, Stop and Continue arrive at the next status check.

## ADR-052: What leaves the app: a CSV with a row per part, and sheets as PDFs

- **Status:** Accepted · **Date:** 2026-11-13 · Adds to the test plug-in in ADR-001 and ADR-047 · Answers where the export lives (ADR-046) · Changes how a sheet is downloaded (ADR-047)

**Context:** Roadmap 10.1 planned a CSV that matched the Results list, which was removed at 8.7 (ADR-046).
Roadmap 10.2 planned sheet downloads as stand-alone SVG, but clinicians file and print PDFs. Both
files leave the app and live on the clinician's computer afterwards.

**Decision:**

- Export CSV sits in a ⋯ menu to the right of New sequence on the Clients list. It exports every
  completed or stopped test of the clients the search shows, read fresh through RLS.
- One row per part: Client ID, Visit date, Test, Part, Status, then each test's measures. Clients are
  sorted by client ID, visits oldest first, tests in the order given. A row is blank under other tests'
  columns.
- Each test's `summary.ts` provides `csvMeasures` (its columns, once) and `csvRows(scores)` (raw values,
  null for a blank), listed in `sequence-tests.ts`. The shared builder never knows how a test is scored.
- Nothing else goes in the CSV: no notes (free text could identify a client), no clinician names, no
  browser, screen size, test version or times.
- Any text cell starting with `=`, `+`, `-`, `@`, tab or carriage return gets a `'` in front, so Excel
  opens it as text. We pass Papa Parse our own pattern, since its built-in one misses a cell with a line break.
- Download on a sheet gives a one-page Letter PDF, made in the browser: a heading (client ID, test, sheet,
  date), a line per score row with the client page's wording (from `scoreTable`: the rows pointing to this
  sheet, plus rows with no sheet of their own, such as SWAPS's recall), then the sheet drawn as an image at
  300 dpi. The scores go on the PDF only, never into the saved sheet, since they're the server's and can be
  corrected (ADR-040). The SVG is drawn only through an `<img>`, so any
  script in it never runs (ADR-041). jsPDF loads only when a sheet is downloaded. View still shows the SVG.
- Download reads the file through the storage rules (`download`), not a signed link. View keeps its
  10-minute signed link.
- Papa Parse and jsPDF are pinned to exact versions at least two weeks old.

**Consequences:**

- A new test needs `csvMeasures` and `csvRows`, with unit tests, as well as `scoreTable`, `practiceRow`
  and `sheetLabels`.
- If a test's score shape changes, its `csvRows` must handle older results too (as in ADR-045).
- The PDF is a picture of the sheet, not vector shapes: it prints cleanly but blurs if zoomed far in.
- Drawing an SVG with an embedded font onto a canvas varies by browser, Safari especially. Check the PDF in
  each browser at 10.4.
- Downloaded files live on the clinician's computer, outside RLS. Keeping them safe is the practice's job;
  mention it to the clinicians at 10.4.

## ADR-053: A reopened link resets the running test's holds

- **Status:** Accepted · **Date:** 2026-11-14 · Changes ADR-049 (a hold can be undone by this reset) · Builds on ADR-036

**Context:** After a reload mid-test, ADR-036 starts the test again from its beginning, but the server
still counted the holds released before. The restarted test skipped them, so a timed part could start
without Continue (Phase 9 code review).

**Decision:**

- Each time the link is opened, check-link puts the running test (the first pending one) back to its
  start: both hold counts to 0, `began_at`, `timed_part` and `timed_part_started_at` cleared. It
  happens before the welcome screen, so the tab never sees the old counts.
- Not while a stop is requested: the tab answers that stop as things stand (ADR-049).
- The lock on finished rows allows this one drop (migration `allow_hold_reset`): both counts to 0
  together, with no stop requested. Any other drop is still refused.

**Consequences:**

- The dashboard shows the restart: the dot goes off until the client is past the sound check, then
  Continue reads the test's first step again.
- A stop after the reload but before the first Continue is saved as `not_given`, with the clinician's
  reason. What the client did before the reload was never saved (ADR-036).
- Opening the link in a second tab resets the first tab's test too; it drops back to the wait or break
  screen until Continue. Two tabs on one link aren't supported.
- Nothing records that a restart happened. Add a count by migration if the clinicians want to see it.
