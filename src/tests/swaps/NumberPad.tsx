// The 1–7 number pad below the SWAPS grid. A press counts on pointer down, as in Trail Making.
// Nothing listens for clicks, so Space and Enter do nothing (SPEC: the keyboard does nothing).

import type { PointerEvent } from "react";

const numbers = [1, 2, 3, 4, 5, 6, 7] as const;

type NumberPadProps = {
  disabled?: boolean;
  onPick: (number: number) => void;
};

function NumberPad({ disabled = false, onPick }: NumberPadProps) {
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, number: number) {
    // On a Mac, Ctrl + click is a right-click. Browsers can still send pointer events to a disabled button.
    if (disabled || event.button !== 0 || event.ctrlKey) {
      return;
    }

    onPick(number);
  }

  return (
    <div role="group" aria-label="Number pad" className="flex justify-center gap-3 select-none">
      {numbers.map((number) => (
        <button
          key={number}
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onPointerDown={(event) => handlePointerDown(event, number)}
          className="h-16 w-20 cursor-default rounded-xl border-2 border-accent bg-white text-3xl font-bold text-accent disabled:opacity-50"
        >
          {number}
        </button>
      ))}
    </div>
  );
}

export default NumberPad;
