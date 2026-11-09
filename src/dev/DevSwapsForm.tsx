// Development only (roadmap 6.1–6.3): the SWAPS form and number pad working together, to check by hand.

import { useState } from "react";
import { keyPrintedOrder } from "../tests/swaps/form-a";
import NumberPad from "../tests/swaps/NumberPad";
import { canSelect, nextEmpty, type Answers } from "../tests/swaps/selection";
import SwapsPage from "../tests/swaps/SwapsPage";
import { isOnScreen, topRowFor } from "../tests/swaps/visible-rows";

// The timed test's boxes, so the selector starts on item 7.
const part = { first: 7, last: 81 };
const arrowTargets = ["item:1", "item:2", "item:3", "item:6", "item:7", ...keyPrintedOrder.map((symbol) => `key:${symbol}`)];

function DevSwapsForm() {
  const [answers, setAnswers] = useState<Answers>(new Map());
  const [selected, setSelected] = useState<number | null>(part.first);
  const [disabled, setDisabled] = useState(false);
  const [arrowOn, setArrowOn] = useState<string | null>(null);
  const topRow = topRowFor(nextEmpty(part, answers) ?? part.last);

  function handlePick(number: number) {
    if (selected === null) {
      return;
    }

    const updated = new Map(answers).set(selected, number);
    setAnswers(updated);
    setSelected(nextEmpty(part, updated));
  }

  function handleItemPress(item: number) {
    if (!disabled && canSelect(part, answers, item) && isOnScreen(item, topRow)) {
      setSelected(item);
    }
  }

  return (
    <div className="flex h-screen flex-col pb-6">
      <label className="fixed top-2 left-2 text-base">
        <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} /> Pad off
      </label>
      <select className="fixed top-10 left-2 text-base" value={arrowOn ?? ""} onChange={(event) => setArrowOn(event.target.value || null)}>
        <option value="">No arrow</option>
        {arrowTargets.map((target) => (
          <option key={target}>{target}</option>
        ))}
      </select>
      <SwapsPage answers={answers} selected={selected} topRow={topRow} arrowOn={arrowOn} onItemPress={handleItemPress} />
      <NumberPad disabled={disabled} onPick={handlePick} />
    </div>
  );
}

export default DevSwapsForm;
