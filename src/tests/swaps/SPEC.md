# SWAPS — SPEC

- **Test id:** `swaps`
- **Spec status:** Draft, 2026-11-06. Items marked ⏳ are working answers,
  **pending clinician approval**. Build with them; change them if the clinicians say so.
- Decisions here follow `claude/assessment-app-brief.md` and `docs/DECISIONS.md`.

## Source and permission

- **Test:** Southwestern Assessment of Processing Speed (SWAPS), C. Munro Cullum,
  UT Southwestern. Form © 2012 by C. Munro Cullum.
- **Published** as a free alternative to commercial symbol-coding tests, with
  demographically corrected norms for ages 50+ (Cullum et al., 2021,
  _The Clinical Neuropsychologist_).
- **Permission:** the clinicians report the author's permission to digitize SWAPS for
  their practice. A copy goes on file before launch (roadmap 12.2). SWAPS is enabled
  per practice.
- **Source files:** `SWAPS_Standard_General_Instructions_rvsd_7.12.21.pdf`,
  `SWAPS_Stimuli_FormA_rvsd_7.12.21.pdf`, `SWAPS_Recall_form.docx`.
- Norms are applied by the clinicians outside the app.

## What the client does

Looks at a key of 7 symbols, each with its number inside, and fills in the number that
goes with each symbol in a grid, by clicking a 1–7 number pad. Then, on a recall screen,
fills in the number for each symbol from memory.

**Key (Form A):** triangle 1, cross 2, circle 3, pentagon 4, square 5, flag 6, heart 7.
(Printed on the form in the order flag, pentagon, triangle, square, heart, circle, cross.)

**Grid (Form A):** 9 rows of 9 symbols, read left to right, top to bottom.
F flag, P pentagon, T triangle, S square, H heart, C circle, X cross:

| Row | Symbols   |
| --- | --------- |
| 1   | HTFXHSTPC |
| 2   | SFTPCHXSH |
| 3   | CPSHTFCHX |
| 4   | FXCXHPFTS |
| 5   | PSHTFXTCP |
| 6   | HFSCPTXFC |
| 7   | XTCHTFPSP |
| 8   | CHSFPTXCH |
| 9   | TXPSCSHXF |

| Part     | Items                          | Timed   | Scored               |
| -------- | ------------------------------ | ------- | -------------------- |
| Demo     | 3 (row 1, items 1–3)           | No      | No                   |
| Practice | 3 (row 1, items 4–6, gray box) | No      | No                   |
| Test     | 75 (row 1 item 7 to the end)   | 60 s    | 1 point each, max 75 |
| Recall   | 7 symbols                      | ⏳ 60 s | 1 point each, max 7  |

## Screen and layout

- The key stays visible at the top for the whole test (not on the recall screen).
- The grid looks like Form A: each symbol is drawn empty and the client's number goes
  inside it, as in the key. In these rules, an item's "box" means that spot inside its
  symbol. Row 1 has two gray boxes side by side, demo items 1–3 and practice items 4–6,
  sharing one thin line between them, with the form's printed "Demo" and "Practice"
  labels above them (ADR-034). The practice symbols are white, as printed.
- **Rows 1–6 show at the start.** When the client reaches row 5, the grid scrolls up
  slowly so the next rows come into view (S5). The client can't scroll it.
- **The 1–7 number pad** sits below the grid (layout from the design
  prototype). Buttons are 56px+ tall. The keyboard does nothing (S4, S19).
- The selected symbol is outlined in the accent color.
- **Voice only:** no instruction or demo text on screen, apart from those two labels. The voice reads while arrows
  and highlighted boxes show what it means.
- No timer, countdown, error text, help number or end/skip button on screen.
- Clicking (number pad and boxes) is disabled while the voice speaks.

## Flow

1. **Introduction and demo (untimed):** the voice explains the task with the key and
   grid on screen; the app fills in the first 3 boxes as the examiner would.
2. **Practice (untimed):** the client fills in the 3 gray-box items, with feedback
   on wrong answers.
3. **Test:** the voice gives the test instructions, ending "Ready? Begin!" The 60-second
   timer starts when that clip ends.
4. **At 60 seconds:** answering stops and the test part ends, with no spoken cue.
   If all 75 are done sooner, the test part ends then.
5. **Recall:** a new screen with the 7 symbols (no key, no grid). ⏳ The voice reads the
   recall instruction; the client has 60 seconds.
6. `onComplete` returns the result. The sequence runner shows the break screen.

Each step moves to the next automatically, after a short pause (about 1.5 s; one setting).
The clinician can end the test at any point from the dashboard (see "Stopped by the clinician").

## Script

**Rule:** the SWAPS Standard General Instructions (rvsd 7.12.21), word for word, except
the ⏳ adaptations below. Bracketed examiner actions become arrows, highlights and
numbers filling in. The exact lines, with IDs, live in `script.json`.

### ⏳ Adaptations (pending clinician approval)

| #   | Source wording                                                 | App wording                                                                 | Why                                                           |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| SW1 | _(none: the instructions don't cover wrong practice answers)_  | "This number [arrow on the right number in the key] goes with this symbol." | Practice feedback (S7), built from the demo's own words.      |
| SW2 | "Write in the numbers that go with each symbol…" (recall form) | "Fill in the numbers that go with each symbol…"                             | Clients click, not write. "Fill in" is the test's own phrase. |

### Introduction and demo

> Here we have different symbols paired with numbers. Each symbol has its own number.
> Your job is to fill in the correct number that goes with each symbol.

> Here is a symbol **[arrow on grid item 1]**. This number \*\*[arrow on the 7 inside the
>
> > heart in the key]** goes with this symbol, so I would put it here like this.
> > **[7 fills in inside item 1]\*\*

> Here is the next symbol **[arrow on item 2]**. This number \*\*[arrow on the 1 inside
>
> > the triangle in the key]** goes with this symbol, so I would put it here like this.
> > **[1 fills in inside item 2]\*\*

> This symbol **[arrow on item 3]** goes with this number \*\*[arrow on the 6 inside the
>
> > flag in the key]**, so I would put it here like this. **[6 fills in inside item 3]\*\*

Each demo item's box is highlighted while it's being talked about.

### Practice

> Now you do the rest of these, in the gray box. Stop here \*\*[arrow on the end of the
>
> > gray box]\*\*.

Then the selector moves to item 4 and the number pad turns on.

### Test

> Good. Now that you know how to do it, I want you to continue filling in the number
> that goes with each symbol. Be sure to work from left to right, without skipping any.
> When you finish this line go on to the next one.

⏳ The examiner's pointing at row 1, then row 2, is left out (decided 2026-11-08), because
the selector moves to the next row by itself.

> When I say begin, start here **[arrow on item 7]** and work as quickly as you can,
> without making mistakes, until I tell you to stop. Ready? Begin!

"Ready?" and "Begin!" are separate clips with a short pause between them. The timer
starts when "Begin!" ends.

### Recall ⏳

> Fill in the numbers that go with each symbol from the test you recently completed that
> looked like this **[highlight the 7 symbols]**. It is ok to guess if you are not sure.

The recall timer starts when this clip ends.

## Answering rules (practice and test)

- **Selector:** one answer box is selected at a time, outlined in the accent color.
  At the start of practice it's item 4; at the start of the test, item 7.
- **Answering:** clicking a number fills the selected box, and the selector moves to the
  next box.
- **No skipping (S10):** only the next empty box can be selected from the empty boxes ahead.
- **Corrections (S9):** clicking a filled box in the current part selects it; the next
  number replaces the answer, and the selector returns to the next empty box. Changing
  to a different number counts as a correction; choosing the same number again doesn't.
  Only boxes still on screen can be corrected.
- **No feedback in the test.** Wrong answers are recorded, not announced.
- **Scrolling (S5):** when the selector reaches row 5 of the visible rows, the grid
  scrolls up one row smoothly (about 0.6 s; one setting). Clicking keeps working while it moves.

## Practice feedback ⏳

- On a wrong practice answer, the wrong number is cleared, the voice says SW1 with an
  arrow on the right number in the key, and the box is selected again.
- This repeats until the answer is right. There's no limit on tries; if the client
  can't finish practice, the clinician ends the test from the dashboard (S7).
- Practice answers are not scored. Only the number of wrong practice answers is recorded.

## Timing

- **Test:** starts when "Begin!" ends (`performance.now()`). Ends at exactly 60 s, or
  when the 75th item is answered. No spoken cue at the end (decided 2026-11-06), even
  though the script says "until I tell you to stop."
- **Recall:** ⏳ 60 s from the end of the recall instruction. It always runs the full
  60 s (decided 2026-11-06).
- No timer or countdown is ever shown.

## Recall screen

- The 7 symbols in recall-form order: **square, flag, triangle, pentagon, circle, heart,
  cross**. Drawn empty, as on the form, with no key and no grid.
- The selected symbol is outlined. Clicking a number puts it **inside** the symbol, and
  the selector moves to the next empty symbol.
- Clicking any symbol selects it, so answers can be changed until time is up.
- **At 60 s the screen ends.** Any symbol still empty is scored as wrong. ⏳ This replaces
  the earlier "untimed, no blanks" answer (S14–S15).

## Scoring

Pure functions, tested first (roadmap 3.6–3.8). Raw scores only. The **final answer**
in each box is the one scored.

**Test** (`scores.test`):

| Field         | Meaning                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| `status`      | `completed` (all 75 before 60 s), `timedOut`, `stopped` or `notGiven`                  |
| `timeMs`      | Time to the 75th answer if finished early; 60000 if timed out; elapsed time if stopped |
| `attempted`   | Boxes with an answer, 0–75 ("number completed", S13)                                   |
| `correct`     | Correct final answers, 0–75. **This is the SWAPS score.**                              |
| `errors`      | Wrong final answers (`attempted` − `correct`)                                          |
| `corrections` | Times an answer was changed to a different number (S9)                                 |

**Recall** (`scores.recall`):

| Field     | Meaning                                      |
| --------- | -------------------------------------------- |
| `status`  | `completed`, `stopped` or `notGiven`         |
| `correct` | Correct answers, 0–7 (S15)                   |
| `blank`   | Symbols left empty at 60 s (scored as wrong) |

**Practice:** `wrongAnswers`, the number of wrong practice answers (not scored).

## Recording (`rawData`)

- **Answer log** for the test and recall: every number click, with box or symbol, number
  and time from the start of that part. Kept for review and server re-scoring only; no
  per-answer timing goes into `scores` (S18).
- **Stop time:** if the clinician stopped the test or recall, ms from the start of
  that part to the stop, so the server can re-score the partial result.
- **Final answers** for all 75 test boxes and the 7 recall symbols.
- **Audio log:** when each clip started and ended.
- **Screen:** screen size, page scale, browser name and version.
- **Focus:** any time the test tab was hidden or lost focus, with times.
- **Sheet (SVG, in the result's `sheets`, not `rawData`):** the grid as it ended, with **errors** and **corrections** clearly
  marked (S13; e.g. a wrong answer circled, a corrected answer showing the old number
  struck through), plus the recall answers below it.

## Stopped by the clinician

- **During the introduction, demo, practice or test instructions (before the timer
  starts):** test and recall are `notGiven`.
- **During the test:** the test is `stopped` with its partial counts and elapsed time;
  recall is `notGiven`.
- **During the recall instruction (before its timer starts):** the test result
  stands; recall is `notGiven`.
- **During recall:** the test result stands; recall is `stopped` with the answers so far.
- The voice stops, answering stops, the stop reason is saved, and the sheet is saved as
  it stood. The partial result goes through the shared stop hook.

## Who decides what

**The app decides** (change here, no clinician sign-off needed):

- The selector and auto-advance, scrolling one row at row 5, scroll speed
- Pause lengths (between steps, between "Ready?" and "Begin!")
- Not counting a re-pick of the same number as a correction
- Screen layout, the too-small-screen message, the sheet's marking style

**The clinicians decide** (every ⏳ in this file):

- SW1 practice feedback and SW2 recall wording, and voice-only instructions
- Recall timing (60 s, always full) and scoring blanks as wrong
- No spoken cue at the end of the 60 seconds
- Leaving out the row 1 and row 2 highlights in the test instructions

## Questions for the clinicians

1. In the meeting you said instructions should be written on screen as well as read
   aloud. SWAPS is now voice only, with arrows, highlighted boxes and numbers filling in,
   and no text. OK?
2. For a wrong practice answer, the instructions don't say what to do. We clear it and
   say "This number goes with this symbol," pointing at the right number in the key,
   then let the client try again. OK?
3. On the recall screen, OK to say "Fill in the numbers…" instead of "Write in the numbers…"?
4. Recall now has 60 seconds and always runs the full 60. Anything left blank is scored
   wrong. (In the meeting it was untimed, with every symbol answered.) OK?
5. The script says "until I tell you to stop," but at 60 seconds the app just moves on,
   with no "Stop." OK, or would you like a spoken "Stop."?
6. Answered 2026-11-08: if a client changes an answer, only the final answer is
   scored, a corrected answer isn't an error, and every correction is recorded.
7. Which norms will you use? They come from paper testing (see below).
8. The instructions have the examiner point to row 1, then row 2, after "When you finish
   this line go on to the next one." The app leaves that out, because the selector moves
   to the next row by itself, so nothing on screen shows what "this line" means. OK, or
   would you like the rows highlighted?

## Digital vs. paper: what may change

SWAPS norms (Cullum et al., 2021) come from pencil and paper. These differences may make
them fit less well:

- **Clicking a number pad, not writing.** For many people, clicking is faster than
  writing digits; for people new to a mouse or trackpad, it may be slower. Scores may
  shift either way.
- **Eyes move between grid, key and pad.** On paper, the client looks between the key and
  the grid. The pad adds a third place to look.
- **Only 6 rows show at a time, then the grid scrolls.** On paper, the whole page is visible.
- **Screen size** changes symbol size. Screen size is saved with each result.
- **Recall is timed (60 s)** here, and the delay before it is always the same. On paper,
  recall is untimed and the delay varies.
- **A standard, voice-only demo** in place of an examiner, which may help or hinder some clients.
- **What it means:** clinicians should judge whether paper norms apply, and may want to
  read scores more cautiously or build their own reference data over time.
