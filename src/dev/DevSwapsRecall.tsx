// Development only (roadmap 6.8): the SWAPS recall screen and number pad, to check by hand. No voice, no timer.

import { useState } from "react";
import NumberPad from "../tests/swaps/NumberPad";
import RecallPage from "../tests/swaps/RecallPage";
import { nextEmptyAfter, type Answers } from "../tests/swaps/selection";

const part = { first: 1, last: 7 };

function DevSwapsRecall() {
  const [answers, setAnswers] = useState<Answers>(new Map());
  const [selected, setSelected] = useState(part.first);
  const [allHighlighted, setAllHighlighted] = useState(false);

  function handlePick(number: number) {
    const updated = new Map(answers).set(selected, number);

    setAnswers(updated);
    setSelected(nextEmptyAfter(part, updated, selected) ?? selected);
  }

  return (
    <div className="flex h-screen flex-col pb-6">
      <label className="fixed top-2 left-2 text-base">
        <input type="checkbox" checked={allHighlighted} onChange={(event) => setAllHighlighted(event.target.checked)} /> Highlight all
      </label>
      <RecallPage answers={answers} selected={selected} allHighlighted={allHighlighted} onSymbolPress={setSelected} />
      <NumberPad onPick={handlePick} />
    </div>
  );
}

export default DevSwapsRecall;
