// Development only (roadmap 6.1–6.3): the SWAPS form and number pad working together, to check by hand.

import { useState } from "react";
import NumberPad from "../tests/swaps/NumberPad";
import { canSelect, nextEmpty, type Answers } from "../tests/swaps/selection";
import SwapsPage from "../tests/swaps/SwapsPage";

// The timed test's boxes, so the selector starts on item 7.
const part = { first: 7, last: 81 };

function DevSwapsForm() {
  const [answers, setAnswers] = useState<Answers>(new Map());
  const [selected, setSelected] = useState<number | null>(part.first);
  const [disabled, setDisabled] = useState(false);

  function handlePick(number: number) {
    if (selected === null) {
      return;
    }

    const updated = new Map(answers).set(selected, number);
    setAnswers(updated);
    setSelected(nextEmpty(part, updated));
  }

  function handleItemPress(item: number) {
    if (!disabled && canSelect(part, answers, item)) {
      setSelected(item);
    }
  }

  return (
    <div className="flex h-screen flex-col pb-6">
      <label className="fixed top-2 left-2 text-base">
        <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} /> Pad off
      </label>
      <SwapsPage answers={answers} selected={selected} onItemPress={handleItemPress} />
      <NumberPad disabled={disabled} onPick={handlePick} />
    </div>
  );
}

export default DevSwapsForm;
