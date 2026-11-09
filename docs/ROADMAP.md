# Roadmap

The build, broken into small steps. Each step is about one session and teaches
one thing. Tick a box only when its "Check" passes.

**Current step:** 6.6

How to use this file:

- Work top to bottom. Phases build on each other.
- At the start of a session, tell Claude Code the step number.
- If a step turns out bigger than one session, split it here before starting.
- If a decision changes during a step, record it in `docs/DECISIONS.md`.

---

## Phase 1 — Repo and environments

- [x] **1.1 Install the tools**
  - Learn: what Node, npm, git and the Supabase CLI each do
  - Check: `node -v` shows v24; `git --version` works; `npx supabase --version` works

- [x] **1.2 Create the app and put it on GitHub**
  - Learn: what Vite generates (index.html, src/main.tsx, package.json); first commit and push
  - Check: `npm run dev` shows the starter page; the repo is on GitHub (public, see ADR-013)

- [x] **1.3 Add the docs and create the `dev` branch**
  - Learn: what a branch is; why `dev` and `main` are separate
  - Check: CLAUDE.md, docs/ and the test SPEC/script files are committed; both branches are on GitHub

- [x] **1.4 Add Tailwind, the font and the design colors**
  - Learn: Tailwind setup; turning the design system into theme colors and sizes
  - Check: a test page shows Atkinson Hyperlegible, the background #F7F6F2 and a 56px accent button

- [x] **1.5 Add Vitest and a typecheck script**
  - Learn: how a unit test is written and run; what `tsc --noEmit` catches
  - Check: one sample test passes with `npm test`; `npm run typecheck` shows no errors

- [x] **1.6 Create the two Supabase projects**
  - Learn: what a Supabase project contains (database, auth, storage, keys); which key is public and which is secret
  - Check: `development` and `production` both exist; you can open each one's table editor

- [x] **1.7 Connect the app to Supabase with environment variables**
  - Learn: `.env.local`; why anything starting with `VITE_` ends up public in the browser; `.gitignore`
  - Check: the app reads the development project's URL from the env file; `.env.local` is not in git; no secret key anywhere in `src/`

- [x] **1.8 Deploy with Cloudflare Pages**
  - Learn: branch deploys; per-environment variables in Cloudflare
  - Check: a push to `dev` updates the preview address (development settings); `main` deploys, and the production variables are set in Cloudflare
  - Note: `main` first shows the production URL after the end-of-phase merge (after 1.9, ADR-014)

- [x] **1.9 Lock the preview address**
  - Learn: Cloudflare Access; why preview links are public by default
  - Check: opening the preview in a private window asks for a login

## Phase 2 — Database schema and migrations

Every change in this phase is a migration file, applied to `development` first.
Exact columns are decided at the start of each step.

- [x] **2.1 Link the CLI and write the first migration: `practices`**
  - Learn: what a migration is; `supabase link`, `migration new`, `db push`; uuid primary keys
  - Check: the `practices` table exists in development; the migration file is committed

- [x] **2.2 Clinician accounts and practice membership**
  - Learn: Supabase's built-in `auth.users` vs. your own `clinicians` table; foreign keys
  - Check: you can sign in as a clinician in development; your `clinicians` row links you to Sawtooth

- [x] **2.3 Clients and each practice's enabled tests**
  - Learn: a unique rule across two columns (`practice_id` + client code)
  - Check: a duplicate client code in the same practice is rejected; the same code in another practice is allowed

- [x] **2.4 Sequences**
  - Learn: generating link tokens nobody can guess; limiting a status column to set values
  - Check: link tokens are unique across the whole app; an unknown status value is rejected

- [x] **2.5 Tests in a sequence and their results**
  - Learn: `jsonb` for scores and raw data; storing test version, stop reason and screen size
  - Check: a fake completed result and a fake stopped (partial) result both save

- [x] **2.6 Clinician notes**
  - Learn: recording who did what and when (clinician id + timestamp)
  - Check: a note saves with the clinician who wrote it

- [x] **2.7 Row-level security**
  - Learn: how RLS policies work; a helper function that returns the signed-in clinician's practice
  - Check: with a second fake practice, its clinician sees zero Sawtooth rows; a signed-out user sees nothing in any table

- [x] **2.8 Storage for sheets**
  - Learn: Supabase Storage buckets; storage rules by `<practice_id>/` folder
  - Check: a clinician can't read or upload a file in another practice's folder

- [x] **2.9 Seed data for development**
  - Learn: `seed.sql`; resetting a database
  - Check: resetting development fills fake clients and results; nothing in the seed looks like a real person

- [x] **2.10 Apply the migrations to production**
  - Learn: switching the CLI between projects; the release routine
  - Check: `supabase migration list --remote` matches on both projects; production has no seed data

- [ ] **2.11 (Optional) Local Supabase with Docker**
  - Learn: running Supabase on your own computer; testing migrations without touching the cloud
  - Check: `supabase start` runs; migrations and seed apply locally
  - Note: skipped by choice (2026-11-08). Development resets already test migrations from scratch, so Docker isn't needed.

## Phase 3 — Scoring logic with tests

Pure TypeScript only: no React, no Supabase, no clock inside a scoring function.
For each step: write the tests from SPEC.md first, watch them fail, then write
the code. Edge cases come from each test's SPEC.md.

- [x] **3.1 Shared types for tests and results**
  - Learn: TypeScript types and interfaces; the plug-in contract as code
  - Check: `src/shared/` has the test module and result types from CLAUDE.md; `npm run typecheck` passes

- [x] **3.2 A clock you can fake**
  - Learn: wrapping `performance.now()` so tests can pass in fixed times
  - Check: a test runs with a fake clock and gets the same answer every time

- [x] **3.3 Trail Making: the expected order**
  - Learn: keeping test data (orders, labels) separate from logic
  - Check: tests confirm Part A is 1–25 and Part B is 1-A-2-B … 13; samples are 1–8 and 1-A … 4-D

- [x] **3.4 Trail Making: judging each click**
  - Learn: writing tests first from a list of rules; one function, one job
  - Check: tests pass for a correct click, a wrong circle, an out-of-order circle, re-clicking the last correct circle (ignored) and a click after the end

- [x] **3.5 Trail Making: the result from a click log**
  - Learn: turning a list of events into a score; handling "finished", "timed out" and "stopped"
  - Check: tests pass for a full run, a timeout (records the max time: 150 s A, 300 s B) and a clinician stop (partial score kept)
  - Note: write Trail Making's own score type here, in its test folder, then check `partA`, `partB`, `sampleA` and `sampleB` in `seed.sql` against it (decided at 3.1)

- [x] **3.6 SWAPS: the key and Form A grid**
  - Learn: encoding a printed form as data, and testing it against the paper
  - Check: the key has 7 symbols with the right numbers; the grid has 81 items (3 demo, 3 practice, 75 test) matching the brief row by row

- [x] **3.7 SWAPS: the result from an answer log**
  - Learn: counting corrections and errors; deciding which answer counts after a correction
  - Check: tests pass for a full 60 s run, a correction from wrong to right, a correction from right to wrong and a clinician stop (partial score kept)
  - Note: write SWAPS's own score type here, in its test folder, then check `test` and `practice` in `seed.sql` against it (decided at 3.1)

- [x] **3.8 SWAPS: recall score**
  - Learn: a small scoring function from start to finish on your own
  - Check: tests pass for 7/7, 0/7 and a mix; a blank answer is scored as wrong and counted
  - Note: add recall to SWAPS's score type, then check `recall` in `seed.sql` against it (decided at 3.1)

- [x] **3.9 Wording tests for `script.json`**
  - Learn: using tests to guard exact wording; snapshot tests
  - Check: changing one word in either `script.json` makes `npm test` fail until the change is approved

## Phase 4 — Audio pipeline

The voice is a core feature. Build it early and check Safari early.

- [x] **4.1 ElevenLabs account and API key**
  - Learn: keeping a build-time key on your own computer only (no `VITE_` prefix, never in `src/`)
  - Check: the key is in `.env.local` without `VITE_`; `.env.local` is gitignored; the voice ID and service are single settings

- [x] **4.2 Load and check `script.json`**
  - Learn: describing a file's shape with a type and rejecting bad files
  - Check: both tests' `script.json` files load; a line with a missing ID or an unknown type ("spoken"/"action") is rejected

- [x] **4.3 Generate one clip**
  - Learn: calling a text-to-speech API from a Node script; saving an audio file
  - Check: `npm run audio` turns one spoken line into `public/audio/<test-name>/<line-id>.mp3`, and it plays

- [x] **4.4 Only regenerate changed lines**
  - Learn: content hashes and a manifest file
  - Check: a second run makes zero API calls; editing one line regenerates only that clip

- [x] **4.5 Pronunciation hints**
  - Learn: keeping spoken text and displayed text separate
  - Check: a hint changes the audio only; the script's displayed text is unchanged; hinted lines are listed for review

- [x] **4.6 The audio player**
  - Learn: Howler.js preloading; using a clip's end to trigger the next step
  - Check: a demo page plays three clips back to back, each starting when the last one ends

- [x] **4.7 First click and sound check**
  - Learn: why browsers block sound until a click; unlocking audio
  - Check: the "Can you hear this?" screen works in Chrome and Safari after one click

- [x] **4.8 Placeholder voice and missing-clip check**
  - Learn: falling back to the browser's voice in development only; failing a build on purpose
  - Check: in development a missing clip uses the browser voice; a production build fails if any clip is missing

**4.9 Cross-browser timing check:** moved to 7.9 (decided 2026-11-08, not measured yet).

## Phase 5 — Trail Making test

Built as a module in `src/tests/trail-making/`, run from a development-only
page until the sequence runner exists (Phase 7).
Steps 5.7 and 5.8 were built on working answers (ADR-030, ADR-032). The clinicians haven't been asked yet (see the SPEC's questions).

- [x] **5.1 Development test page and a fake ResultStore**
  - Learn: an in-memory version of an interface; development-only routes
  - Check: `/dev/test/trail-making` loads in development; the route isn't in the production build
  - Note: write the `ResultStore` interface here, before the fake one (decided at 3.1)

- [x] **5.2 Circle positions from the PDF**
  - Learn: turning a page layout into SVG coordinates
  - Check: all four pages (Sample A, Part A, Sample B, Part B) look like the scans by eye; circles don't overlap and are easy to click

- [x] **5.3 Draw the page, full screen, scaled to fit**
  - Learn: SVG `viewBox`; scaling to screen height; screenfull
  - Check: looks like the paper page; no scrolling; works in all four browsers

- [x] **5.4 Screen-size check**
  - Learn: measuring the screen; recording it with the result
  - Check: a too-small window shows a message (working threshold of 40 px circles, clinicians to confirm), and enlarging the window brings the test back

- [x] **5.5 Clicking circles and drawing lines**
  - Learn: pointer events in SVG; the whole drawn circle as the click area, with no extra margin; ignoring double-clicks
  - Check: a full correct run works with a mouse and a trackpad; no hover highlight

- [x] **5.6 Errors: slash, arrow and voice**
  - Learn: connecting the click judge (3.4) to the screen; layering SVG marks
  - Check: a wrong click draws a slashed line that stays on screen; "That one was not correct." plays, then an arrow points to the last correct circle, then "Please start here and continue." plays; a correct click during the voice stops it and removes the arrow; a wrong click during the voice is slashed and counted while the voice carries on; a double-click on a wrong circle counts as one error; no error text on screen

- [x] **5.7 Instructions from `script.json`**
  - Learn: running a script line by line (spoken lines play; action lines trigger arrows)
  - Check: lines play in script order, with no instruction text on any page; arrows appear after the matching words; circles can't be clicked while the instruction voice speaks; the timer starts when "Begin." ends; no replay button

- [x] **5.8 Practice rounds**
  - Learn: a small state machine (instructions → practice → test)
  - Check: a sample has no limit on errors or time and doesn't restart; finishing it moves on; practice clicks aren't scored

- [x] **5.9 Part A to Part B, time limits and `onComplete`**
  - Learn: handing a result to the shared layer through the plug-in contract
  - Check: timeouts stop at 150 s / 300 s; the result matches what the 3.5 scoring tests expect; the screen size is saved with the result
  - Note: remove the temporary "Timer started" console line in `TrailMaking.tsx` (added at 5.7)
  - Note: log clicks only during the `test` stage (added at 5.8), so practice clicks are never scored or saved

- [x] **5.10 Save the sheet and click log**
  - Learn: exporting the drawn SVG with the font embedded
  - Check: the saved SVG opens in a browser and shows errors marked; the full click log is in `rawData`
  - Note: record any time the too-small-screen message replaced a timed part, with times (SPEC: Recording, decided at 5.9)
  - Note: check that a click on empty space during a timed part is logged with `circle: null` (not tried at 5.9)

- [x] **5.11 Being stopped from outside**
  - Learn: how the shared layer asks a test for its partial result
  - Check: a fake stop mid-test returns the partial score and the sheet as it stood
  - Note: use the audio player's stop function (added at 5.6), so a stop silences the voice and the test isn't left waiting for the clip to end (ADR-028, Phase 4 code review)

- [ ] **5.12 Clinician look on the preview (going to wait on this**
  - Learn: running a feedback round
  - Check: each clinician has tried it in at least one browser; feedback is in the running list
  - Note: first add each clinician's email to the preview's Cloudflare Access policy (only Jeff's is on it, see 1.9)

## Phase 6 — SWAPS test

Built as a module in `src/tests/swaps/`, run from `/dev/test/swaps`.
Steps 6.5–6.8 need the clinicians' answers on demo text, practice feedback,
the stop wording and the recall instruction (see the brief).

- [x] **6.1 Draw the key and the Form A grid**
  - Learn: drawing the symbols as SVG shapes; laying out a grid from data (3.6)
  - Check: laid over the Form A PDF, the symbols, order and gray practice box match

- [x] **6.2 The 1–7 number pad**
  - Learn: building an accessible button group
  - Check: buttons are 56px+ and easy to hit with a trackpad; the keyboard does nothing during the test

- [x] **6.3 Selecting boxes, auto-advance and corrections**
  - Learn: keeping "which box is selected" in state; rules as small functions
  - Check: the next empty box is selected automatically; no skipping ahead; clicking a filled box lets you change it, then the selector returns to the next empty box

- [x] **6.4 Showing 6 rows and scrolling up slowly**
  - Learn: smooth movement with CSS transforms, without the page jumping
  - Check: rows 1–6 show at the start; the grid moves up slowly at row 5; smooth in Safari; the client can't scroll it

- [x] **6.5 Demo animation**
  - Learn: syncing animation steps with clip endings
  - Check: arrows, highlighted boxes and numbers filling in line up with each spoken demo line; no demo text on screen other than the form's "Demo" and "Practice" labels (ADR-034)

- [ ] **6.6 Practice items**
  - Learn: reusing test behavior with feedback added
  - Check: a wrong answer gets the agreed feedback; practice isn't scored; only the clinician can end it
  - Note: move the demo player from `src/dev/DevSwapsDemo.tsx` and the answers and selected-box state from `src/dev/DevSwapsForm.tsx` into the real test component

- [ ] **6.7 The 60-second test**
  - Learn: starting a timer from a clip end; stopping on time exactly
  - Check: the timer starts at "Begin!"; input stops at 60 s with the agreed wording; results match the 3.7 scoring tests

- [ ] **6.8 Recall screen**
  - Learn: a timed screen that always runs its full 60 seconds
  - Check: the 7 symbols appear without numbers, in recall-form order; answers can be changed until time is up; any left empty are scored as wrong; it's always the last screen of the test

- [ ] **6.9 Save the sheet and answer log; `onComplete`**
  - Learn: marking errors and corrections clearly in an exported SVG
  - Check: the saved sheet shows errors and corrections; `rawData` has the full answer log; totals only, no per-answer timing in `scores`
  - Note: SWAPS text is regular weight, but Trail Making's sheet embeds only the bold font. The sheet also needs its own styles for `fill-white` and `fill-form-gray` (added at 6.1)

- [ ] **6.10 Being stopped from outside**
  - Learn: the same stop pattern as Trail Making (5.11)
  - Check: a fake stop mid-test returns the partial score and the sheet as it stood

- [ ] **6.11 Clinician look on the preview**
  - Learn: comparing feedback across tests
  - Check: each clinician has tried it; feedback is in the running list

## Phase 7 — Client link, sequence runner and break screen

Until the dashboard exists (Phase 8), make test sequences in development with SQL
or the seed file.

- [ ] **7.1 First Edge Function: check a link**
  - Learn: Edge Functions (Deno); using the secret key safely on the server; CORS
  - Check: a valid token returns the practice name and the tests to run; an unknown, completed or discontinued token is refused; nothing else about the client is returned
  - Note: decide with the clinicians what happens if a client reopens a link partway (ADR-005 leaves interruptions out of scope); results saved so far are in 2.5's table
  - Note: if the browser has blocked sound, for example after a page reload with no click, `play()` never finishes and the test freezes. Howler's error event doesn't fire in this case. Handle it when deciding what a reopened link does (Phase 4 code review)

- [ ] **7.2 The client's first screen**
  - Learn: the `/t/<link-token>` route; going full screen from a click
  - Check: the practice name shows (from practice settings); one click starts the sound check (4.7) and full screen
  - Note: clip downloads have no time limit or retry, so one stalled clip hangs the sound check forever and one failed clip can't recover without a reload. Decide what the client sees (Phase 4 code review)
  - Note: "Play it again" is disabled while the clip plays, so a keyboard user loses their place. Return focus to it when the clip ends (WCAG 2.2 AA, Phase 4 code review)
  - Note: decide what happens if a client leaves full screen during a test, for example with Esc. The page keeps working at window size, but only another click can bring full screen back (found at 5.3)

- [ ] **7.3 The sequence runner**
  - Learn: a test registry; using the plug-in contract from the outside
  - Check: both tests run back to back on the development test page, with the fake ResultStore

- [ ] **7.4 Break screen**
  - Learn: a simple in-between screen with no way out for the client
  - Check: a break screen shows between tests; the client clicks to start the next test; no end or skip button

- [ ] **7.5 Edge Function: save a result**
  - Learn: checking a token on the server; re-scoring on the server with the same scoring code
  - Check: a result saves to the right sequence; a result with an edited score is rejected or flagged; a result for someone else's token is refused
  - Note: add a database rule so a saved result can't be overwritten and a closed sequence can't reopen (ADR-008), and require `completed_at` to be on or after `started_at` (Phase 2 code review)
  - Note: add `.ts` to the scoring modules' relative imports so Deno can load them, and reject logs with negative or invalid times (Phase 3 code review)

- [ ] **7.6 Upload the sheet**
  - Learn: uploading to Storage through an Edge Function
  - Check: the SVG lands under `<practice_id>/`; the client can't read it back
  - Note: upload each entry in the result's `sheets`, and decide how files are named and how a result finds them (ADR-033)

- [ ] **7.7 The real ResultStore**
  - Learn: swapping one implementation of an interface for another
  - Check: tests now save through the Edge Functions with no changes to the test modules

- [ ] **7.8 End of sequence**
  - Learn: closing a sequence so its link stops working
  - Check: a thank-you screen shows at the end; the sequence is marked complete; reopening the link is refused

- [ ] **7.9 Full run in every browser**
  - Learn: an end-to-end manual test plan; measuring a timing gap across browsers
  - Check: a full sequence (sound check → Trail Making → break → SWAPS → end) works in Chrome, Edge, Safari and Firefox, and results are in the development database; in each browser, the gap between a clip ending and the next step is measured and written down
  - Note: moved here from 4.9. Timed parts start when a clip ends, and Howler's "end" is a timer set to the clip's length, not a report that the sound finished. A gap of tens of milliseconds is harmless; half a second or more, or one browser differing from the others, needs fixing. Choose the method here: a screen recording, or having a development page measure it. Edge and Firefox need installing on Jeff's Mac.

## Phase 8 — Clinician dashboard

Everything here reads through row-level security (2.7), so clinicians only ever
see their own practice.

- [ ] **8.1 Clinician sign-in**
  - Learn: Supabase Auth in React; protecting routes (sign-in method decided at the start of this step)
  - Check: `/dashboard` redirects to sign-in when signed out; sign-out works; a client link never shows the dashboard

- [ ] **8.2 Clinician accounts for all three**
  - Learn: inviting users from the Supabase dashboard (no admin screens in the app yet)
  - Check: each clinician has their own login in development and belongs to Sawtooth

- [ ] **8.3 Clients list and new client codes**
  - Learn: reading and writing through RLS from the browser
  - Check: the list shows Sawtooth's clients only; a new client code saves; a duplicate code shows a clear message
  - Note: first ask the clinicians whether they already have an ID for each client, and what one looks like; loosen the code format (2.3) with a new migration if needed

- [ ] **8.4 Generate Test Sequence**
  - Learn: a modal with checkboxes; an Edge Function that creates the sequence and link
  - Check: choose or create a client, tick tests (only the practice's enabled tests appear), get a link with a copy button; the link works in another tab

- [ ] **8.5 Results list**
  - Learn: grouping, sorting, filtering and searching a list
  - Check: results are grouped under client ID; sort, filter and search by date or client ID all work

- [ ] **8.6 Per-client view**
  - Learn: nested data (client → sequences → tests)
  - Check: one client's sequences, tests and scores over time show in one place; nothing is overwritten by a later visit

- [ ] **8.7 Result detail and sheet viewer**
  - Learn: showing a stored SVG safely; signed URLs for private files
  - Check: scores, status, stop reason and test version show; the sheet opens; raw scores only, no interpretation

- [ ] **8.8 Notes on each test**
  - Learn: saving with the signed-in clinician's ID
  - Check: a note saves and shows who wrote it and when; clients never see notes

- [ ] **8.9 Dashboard accessibility pass**
  - Learn: checking with keyboard only and a screen reader; contrast checks
  - Check: every dashboard page works by keyboard; text meets WCAG 2.2 AA contrast

## Phase 9 — Stop button with real-time

- [ ] **9.1 Stop controls on the dashboard**
  - Learn: recording an action with who did it and why
  - Check: "End current test" and "End whole sequence" both require a reason (Gave up / Interrupted); the action saves with the clinician's ID
  - Note: a stop must be saved before the client's partial result arrives, so the status check (9.3) has something to read. `sequence_tests` doesn't allow that yet; add a stop-request state by migration (Phase 2 code review)
  - Note: a test only learns that it was stopped, not why, so Trail Making can't yet record a part as `notGiven` with code 996 or 997. A stop during a sample needs 996 when the client couldn't do it (ADR-032). Settle how once the clinicians confirm the alphabet check (Phase 3 code review)

- [ ] **9.2 Real-time stop to the client's tab**
  - Learn: Supabase real-time channels; letting a client listen without letting it read tables (approach decided at the start of this step)
  - Check: a stop reaches the client's tab within a second or two; the client can't hear any other sequence's messages
  - Note: consider alerting the dashboard when a client's screen is too small, in case the client can't explain the problem on the call. This needs a client-to-dashboard message and a decision on how it fits with ADR-009 (no live progress view) (raised at 5.4)

- [ ] **9.3 Status-check fallback**
  - Learn: polling an Edge Function every few seconds; stopping the polling cleanly
  - Check: with real-time blocked, a stop still arrives within the polling interval

- [ ] **9.4 What the client sees after a stop**
  - Learn: connecting the stop to each test's partial-result hook (5.11, 6.10)
  - Check: the partial result and sheet save with the stop reason; "end current test" goes to the break screen; "end whole sequence" goes to the end screen and closes the link

- [ ] **9.5 Test both paths in every browser**
  - Learn: blocking WebSockets in browser dev tools to simulate a home network
  - Check: a stop works by real-time and by polling in Chrome, Edge, Safari and Firefox

## Phase 10 — CSV and sheet downloads

- [ ] **10.1 CSV export**
  - Learn: Papa Parse; protecting spreadsheets from formula injection
  - Check: the download matches what's filtered on screen, one row per test, grouped by client ID; a value starting with `=` opens as text in Excel

- [ ] **10.2 Sheet download**
  - Learn: making an SVG that stands alone (font embedded)
  - Check: a downloaded sheet opens in a browser on another computer, looks the same and prints cleanly on one page

- [ ] **10.3 Check what leaves the app**
  - Learn: reviewing exports for privacy
  - Check: the CSV and sheets contain client codes only, with no names or details beyond what the brief allows

## Phase 11 — Custom domain

- [ ] **11.1 Choose the subdomain and get DNS access**
  - Learn: what a subdomain and a CNAME record are
  - Check: the clinicians have picked the name (e.g. `tests.` or `assessments.`); you or they can edit Squarespace DNS

- [ ] **11.2 Connect the subdomain to Cloudflare Pages**
  - Learn: adding a custom domain; how HTTPS certificates get issued
  - Check: the subdomain loads the production app over HTTPS; the development preview is unchanged

- [ ] **11.3 Update production settings for the new address**
  - Learn: auth redirect URLs and allowed origins
  - Check: clinician sign-in, client links and Edge Functions all work on the subdomain; links generated in production use the subdomain

## Phase 12 — Launch checklist

Nothing real goes into production until every box here is ticked.

- [ ] **12.1 Legal and privacy review with a lawyer**
  - Learn: what HIPAA, Washington's My Health My Data Act and Idaho law ask of an app like this
  - Check: written answers on whether a business associate agreement (BAA) is needed with Supabase and other vendors, what clients must be told or agree to, and how long data is kept

- [ ] **12.2 Permissions on file**
  - Learn: keeping license records with the project
  - Check: written SWAPS permission; NACC terms for the Trail Making form; ElevenLabs voice usage terms and commercial license, all saved

- [ ] **12.3 Final audio**
  - Learn: the one-month paid plan and a final, full generation
  - Check: every clip regenerated with the commercial license; a clinician has listened to every clip; clips committed
  - Note: `sb-05` had an "ay" hint removed at 4.5, because Adam read the plain "A" correctly and the hint made it worse. Listen to the "A" on the final voice and add a hint only if it's needed (ADR-029).

- [ ] **12.4 Production database on Pro, with backups**
  - Learn: Supabase backups and restoring from one
  - Check: production is on Pro; daily backups are on; you've practiced a restore (on development)

- [ ] **12.5 Security review**
  - Learn: Supabase's security advisor; reviewing keys and auth settings
  - Check: the advisor shows no warnings; RLS is on for every table; no secret key in `src/` or the built app; production Edge Function secrets are set; sign-in settings are final

- [ ] **12.6 Set up the real practice in production**
  - Learn: adding real (non-seed) setup data safely
  - Check: the Sawtooth practice record, its enabled tests and the three clinician accounts exist in production

- [ ] **12.7 Production dry run**
  - Learn: testing in production without leaving fake data behind
  - Check: a pretend client completes a full sequence on the subdomain; the result and sheet appear; the test data is removed or clearly marked

- [ ] **12.8 Release**
  - Learn: tagging a version
  - Check: the release routine is followed (dev → migrations → merge to main); `v1.0` is tagged; DECISIONS.md is up to date

- [ ] **12.9 First real client, with Jeff on hand**
  - Learn: watching a real session for problems
  - Check: the first sequence completes; any issues are added to the roadmap; Sentry is reconsidered for unwatched sessions
