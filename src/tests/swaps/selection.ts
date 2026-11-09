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
