// Anything measured reads the time through a Clock (ADR-007), so tests can use a fake one.

export type Clock = {
  now: () => number;
};

export const realClock: Clock = {
  now: () => performance.now(),
};

// A clock that reads 0 now and counts up from here.
export function elapsedClock(clock: Clock): Clock {
  const startedAt = clock.now();

  return { now: () => clock.now() - startedAt };
}

// For tests: time moves only when advance() is called.
export function createFakeClock(): Clock & { advance: (ms: number) => void } {
  let time = 0;

  return {
    now: () => time,
    advance: (ms) => {
      time += ms;
    },
  };
}
