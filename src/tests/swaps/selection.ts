// Which SWAPS box can be selected (SPEC: Answering rules). Pure: same inputs, same answer.

export type ItemRange = {
  first: number;
  last: number;
};

// The number in each filled box, by item.
export type Answers = ReadonlyMap<number, number>;

export function nextEmpty(part: ItemRange, answers: Answers): number | null {
  for (let item = part.first; item <= part.last; item += 1) {
    if (!answers.has(item)) {
      return item;
    }
  }

  return null;
}

export function canSelect(part: ItemRange, answers: Answers, item: number): boolean {
  if (item < part.first || item > part.last) {
    return false;
  }

  return answers.has(item) || item === nextEmpty(part, answers);
}

// The next empty item after this one, going round to the start of the part. Null when the part is full.
export function nextEmptyAfter(part: ItemRange, answers: Answers, item: number): number | null {
  const count = part.last - part.first + 1;

  for (let step = 1; step < count; step += 1) {
    const next = part.first + ((item - part.first + step) % count);

    if (!answers.has(next)) {
      return next;
    }
  }

  return null;
}
