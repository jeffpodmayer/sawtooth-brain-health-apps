// Development only (roadmap 6.1, 6.2): draws SWAPS Form A with the number pad, to check both by hand.

import { useState } from "react";
import NumberPad from "../tests/swaps/NumberPad";
import SwapsPage from "../tests/swaps/SwapsPage";

function DevSwapsForm() {
  const [picks, setPicks] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);

  return (
    <div className="flex h-screen flex-col pb-6">
      <div className="fixed top-2 left-2 text-base">
        <label className="block">
          <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} /> Pad off
        </label>
        <p>Presses: {picks.join(" ")}</p>
      </div>
      <SwapsPage />
      <NumberPad disabled={disabled} onPick={(number) => setPicks((earlier) => [...earlier, number])} />
    </div>
  );
}

export default DevSwapsForm;
