# Trail Making Test — SPEC

- **Test id:** `trail-making`
- **Spec status:** Draft, 2026-11-06. Items marked ⏳ are working answers,
  **pending clinician approval**. Build with them; change them if the clinicians say so.
- Decisions here follow `claude/assessment-app-brief.md` and `docs/DECISIONS.md`.

## Source and permission

- **Form and instructions:** NACC Uniform Data Set v4.0, Form C2 worksheets and
  instructions (January 2025), © University of Washington. NACC forms are
  research-only by default; **the clinicians have NACC permission** to use this
  form in their practice. A copy of the permission goes on file before launch (roadmap 12.2).
- **The test itself:** from the 1944 U.S. Army Individual Test Battery.
- **Source file:** `Trail_Making_Test_Digitalize_2.pdf` (6 pages: instructions ×2,
  Sample A, Part A, Sample B, Part B).
- Norms are applied by the clinicians outside the app. They should match this form version.

## What the client does

Clicks circles in order. The app draws a line from the last correct circle to each
new one. Part A is numbers (1 → 25). Part B alternates numbers and letters
(1 → A → 2 → B … → 13). Each part starts with an untimed practice sample.

| Page     | Circles | Order                      | Lines | Timed | Time limit |
| -------- | ------- | -------------------------- | ----- | ----- | ---------- |
| Sample A | 8       | 1 → 8                      | 7     | No    | —          |
| Part A   | 25      | 1 → 25                     | 24    | Yes   | 150 s      |
| Sample B | 8       | 1 → A → 2 → B → … → 4 → D  | 7     | No    | —          |
| Part B   | 25      | 1 → A → 2 → B → … → L → 13 | 24    | Yes   | 300 s      |

## Screen and layout

- Each page looks like the paper page: portrait, circles placed approximately as
  printed (by eye from the scans), with the "Begin" and "End" labels. Sample pages
  keep their box outline. Generally the same circle size as on paper.
- Circle positions live in a data file per page, separate from the code.
- The page is scaled to fill the screen height in full screen and stays static:
  no scrolling, zooming or movement during a test.
- **A click counts only if it lands inside a drawn circle.** Clicks outside every
  circle do nothing (not an error, not logged as a click on a circle).
- No hover highlight on circles.
- No timer, countdown, error text, help number or end/skip button on screen.
- If the screen is too small to show the page at a usable size, show a message
  instead of the test (threshold: open question in the brief). Save the screen
  size with the result.

## Voice and arrows (no instruction text)

- **Trail Making is voice only.** There is no instruction screen and no instruction
  text on any page. The test starts directly on the Sample A page with the voice reading.
- On every page, the voice reads the instructions straight through. Where the script
  says to point, an arrow appears on that circle **after** the voice says it.
- Nothing waits for a click during the instructions. Circles can't be clicked while
  the voice is speaking. The client starts clicking when the voice finishes.
- The timed parts end their instructions with ⏳ "Begin." The timer starts when
  that clip ends.

## Flow

1. **Sample A page:** instructions with arrows → client completes the sample (untimed).
2. **Part A page:** instructions with arrows → "Begin." → timer starts → client
   completes the trail, or time runs out at 150 s.
3. ⏳ **Alphabet check:** done by the clinician before the test (see "Alphabet pre-test").
4. **Sample B page:** instructions with arrows → client completes the sample (untimed).
5. **Part B page:** instructions with arrows → "Begin." → timer starts → client
   completes the trail, or time runs out at 300 s.
6. `onComplete` returns the result. The sequence runner shows the break screen.

Each finished page moves to the next automatically, after a short pause
(about 1.5 s; one setting). The source has no spoken line for these moves.
Failed-practice rules are below. The clinician can end the test at any point from
the dashboard (see "Stopped by the clinician").

## Script

**Rule:** the NACC wording, word for word, except the ⏳ adaptations listed here.
The exact lines, with IDs, live in `script.json`. This section is the human-readable version.

### ⏳ Adaptations (pending clinician approval)

| #   | NACC wording                                                            | App wording                                           | Why                                                                                    |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| W1  | "Please take the pencil and draw a line"                                | "Please click to draw a line"                         | Clients click; there's no pencil.                                                      |
| W2  | "Please try not to lift the pencil as you move from one … to the next." | _(removed)_                                           | Doesn't apply to clicking.                                                             |
| W3  | _(none)_                                                                | "Begin." at the end of each timed part's instructions | The NACC test scripts have no start word. The clinicians asked for "Go or Begin" (T4). |
| W4  | "[point to …]"                                                          | An arrow on that circle, after the words              | Stands in for the examiner's pointing.                                                 |

### Sample A

> There are numbers in circles on this page. Please click to draw a line from one
> number to the next, in order. Start at 1 **[arrow on 1]**, then go to 2
> **[arrow on 2]**, then go to 3 **[arrow on 3]** and so on. Work as quickly as you
> can. Begin here **[arrow on Begin (1)]** and end here **[arrow on End (8)]**.

### Part A (timed)

> On this page there are more numbers in circles. Please click to draw a line from
> one circle to the next, in order. Start at 1 **[arrow on Begin]** and end here
> **[arrow on End]**. Work as quickly as you can. ⏳ Begin.

The NACC note applies: the test instructions say "circle," not "number."

### Sample B

> There are numbers and letters in circles on this page. Please click to draw a line,
> alternating in order between the numbers and letters. Start at number 1
> **[arrow on 1]**, then go to the first letter, A **[arrow on A]**, then go to the
> next number, 2 **[arrow on 2]**, and then the next letter, B **[arrow on B]**, and
> so on. Work as quickly as you can.

### Part B (timed)

> On this page, there are more numbers and letters in circles. Please click to draw a
> line from one circle to the next, alternating in order between the numbers and
> letters. Start at 1 **[arrow on Begin]** and end here **[arrow on End]**. Work as
> quickly as you can. ⏳ Begin.

## Errors

An error is a click on a wrong or out-of-order circle (T6). On every error, in the
samples and the timed parts:

1. A line is drawn from the last correct circle to the clicked circle and slashed
   through. It stays on screen for the rest of the test.
2. The voice says **"That one was not correct."**
3. An arrow points to the last correct circle.
4. The voice says **"Please start here and continue."**
5. The arrow disappears at the next correct click.

- The timer keeps running throughout (T7). Clicks are ignored until step 4 finishes.
- No error text on screen (T2).
- ⏳ **Samples use the same response.** The NACC sample script is a spoken exchange
  ("You were at number 2. What is the next number?", then wait for the answer).
  The app can't hear answers, so it uses the test's error response instead.
- **A wrong first click** (before circle 1 is reached) has no line to slash: the voice
  steps and the arrow on circle 1 still happen.
- **Clicking the last correct circle again** is ignored (treated as a double-click).
- **Clicking a circle already connected earlier** is an error.
- **Clicks outside every circle** do nothing.
- **Clicks after the End circle** are ignored. The part is already over.

## Timing

- **Start:** when the "Begin." clip ends, timed with `performance.now()`.
- **Stop:** the correct click on the End circle (25 in Part A, 13 in Part B).
- **Time limit:** at 150 s (Part A) or 300 s (Part B), clicking stops, the time is
  recorded as the limit and the part is marked timed out (T5). The test moves on.
- **Nothing counts after the limit or a stop.** A click logged after either isn't
  scored, even if the browser's timer fired a moment late.
- Times are stored in milliseconds. Reporting format is in "Scoring."
- Samples are untimed. No timer or countdown is ever shown (T4).

## Practice rules ⏳

- **A failed try:** 3 errors in one try, or 2 minutes without finishing.
- **After a failed try:** the page clears and the sample starts again from the
  beginning, instructions included.
- **Three failed tries on Sample A:** Part A is not given (code 996). The test
  continues to Sample B. The NACC instructions say to present Sample B even if
  Sample A failed.
- **Three failed tries on Sample B:** Part B is not given (code 996). The test ends.
- Practice clicks are not scored or saved. Only each sample's outcome
  (passed / failed, number of tries) is recorded.

## Alphabet pre-test ⏳

The NACC instructions check the alphabet before Part B: "Please tell me the
alphabet starting with the letter A." The app can't hear, so:

- **The clinician does it on the video call before the client starts the test.**
- If the client doesn't pass (by the NACC rule: 3+ errors, or any error on a second
  try), the clinician ends the test from the dashboard once Part A is done, with
  the stop reason **"Alphabet check not passed (997)."** Part A's result is kept;
  Part B is recorded as not given (997).

## Scoring

Pure functions, tested first (roadmap 3.3–3.5). Raw scores only, no derived scores
such as B minus A (T11).

`scores` holds one entry per timed part:

| Field           | Meaning                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `status`        | `completed`, `timedOut`, `stopped` or `notGiven`                                                 |
| `code`          | `996` or `997` when not given for those reasons, otherwise empty                                 |
| `timeMs`        | Start ("Begin." ends) to the End-circle click. Time limit if timed out. Elapsed time if stopped. |
| `timeSeconds`   | ⏳ `timeMs` in seconds, to the nearest tenth (e.g. 28.3)                                         |
| `correctLines`  | Correct connections made, 0–24 (NACC score)                                                      |
| `correctClicks` | Correct circle clicks including circle 1, 0–25 (T12)                                             |
| `errors`        | Error clicks (commission errors). Ignored clicks don't count.                                    |

Plus, per sample: `passed` (yes/no) and `tries` (1–3). A sample is empty (null) if the
test ended before its outcome was known. A `notGiven` part has only `status` and `code`.

## Recording (`rawData`)

- **Click log** for each timed part: time (ms from "Begin."), position on the page,
  which circle (if any), and the outcome: correct, error, or ignored (outside a
  circle, double-click). Clicks during the voice are blocked and not logged.
- **Stop time:** if the clinician stopped a timed part, ms from "Begin." to the
  stop, so the server can re-score the partial result.
- **Pointer movement** during timed parts, sampled about 20 times a second (T13).
- **Audio log:** when each clip started and ended.
- **Screen:** screen size, page scale, browser name and version.
- **Focus:** any time the test tab was hidden or lost focus, with times.
- **Sheets:** one SVG per timed part, as it ended, with errors slashed (T13).
  Samples aren't saved.

## Stopped by the clinician

- The voice stops, clicking stops and the current part is marked `stopped` with
  its partial counts and elapsed time.
- If the stop comes during a sample, that part is `notGiven`.
- If the stop comes during a timed part's instructions, before the timer starts,
  that part is `notGiven`.
- Parts not yet reached are `notGiven`.
- The stop reason (Gave up, Interrupted, Alphabet check not passed) is saved.
- The sheet is saved as it stood. The partial result goes through the shared stop hook.

## Who decides what

**The app decides** (change here, no clinician sign-off needed):

- Click rules: inside the circle only, double-clicks ignored, no clicks during the voice
- Arrow timing, the 1.5 s pause between pages
- Storing milliseconds; the format of the click and pointer logs
- Page scaling and the too-small-screen message

**The clinicians decide** (every ⏳ in this file):

- Wording changes W1–W3, and voice-only instructions
- The sample error response, what counts as a failed try, what happens after one
- Codes 996/997 and the alphabet check process
- How time is reported

## Questions for the clinicians

1. Is "Please click to draw a line" OK instead of "Please take the pencil and draw
   a line"? And OK to drop "Please try not to lift the pencil…"? This is fine.
2. OK to add "Begin." at the end of the real-test instructions? (In the meeting you
   asked for "Go or Begin.") Use begin.
3. In the meeting you said instructions should be written on screen as well as read
   aloud. Trail Making is now voice only, with arrows on the circles and no text. OK?
4. In practice, the paper script asks "What is the next number?" and waits for an
   answer. The app can't hear, so it says "That one was not correct. Please start
   here and continue." instead. OK?
5. What counts as a failed practice try? Our proposal: 3 mistakes, or 2 minutes
   without finishing.
6. After a failed try, should the practice start over with the instructions read again?
7. If Sample A fails three times, skip Part A but still try Sample B, as the NACC
   instructions say? (Earlier you said the test ends.)
8. Will you do the alphabet check on the video call before the test? If the client
   doesn't pass, you'd end the test after Part A with "Alphabet check not passed."
9. Do you want codes 996 and 997 in the results and the CSV?
10. Report time in whole seconds, like the NACC form, or tenths of a second? (Working
    answer: tenths.)
11. Which norms will you use? They come from paper testing (see below).

## Digital vs. paper: what may change

Published Trail Making norms come from pencil and paper. These differences may
make them fit less well:

- **Clicking, not drawing.** Time depends on mouse or trackpad skill, which varies
  widely in older adults. Some will be slower than on paper, some faster.
- **Mouse vs. trackpad** can't be told apart by the browser. Clinicians may want
  to note which one the client used.
- **Screen size** changes how big the circles look and how far apart they are.
  Screen size is saved with each result for this reason.
- **Corrections are identical every time.** On paper they depend on the examiner's
  speed. Here, each error costs the length of the two error clips.
- **Wording and delivery:** the ⏳ changes, voice-only instructions and an exact
  timer start (instead of a stopwatch) all differ from the paper procedure.
- **What it means:** clinicians should judge whether paper norms apply, and may want
  to read scores more cautiously or build their own reference data over time.
