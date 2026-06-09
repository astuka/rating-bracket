import { Game, Match, MATCHUPS_PER_GAME, MIN_GAMES } from "./types";

/**
 * Fisher-Yates shuffle, returns a new array.
 */
function shuffled<T>(input: T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build matchups so every game appears in exactly MATCHUPS_PER_GAME (10) unique
 * matchups with no repeated pairs.
 *
 * This is a circulant graph: with the games laid out in a circle 0..N-1, connect
 * each game `i` to `i+1, i+2, ..., i+5` (mod N). Each game then has 5 forward
 * neighbours plus 5 backward neighbours = degree 10. Because we only use offsets
 * 1..5 (and N >= 11 means the mirror offsets N-1..N-5 fall outside 1..5), every
 * unordered pair is produced exactly once. Total matches = 5 * N.
 */
export function generateMatches(games: Game[]): Match[] {
  const n = games.length;
  if (n < MIN_GAMES) {
    throw new Error(
      `Need at least ${MIN_GAMES} games for ${MATCHUPS_PER_GAME} matchups each (got ${n}).`,
    );
  }

  const half = MATCHUPS_PER_GAME / 2; // 5
  const matches: Match[] = [];
  for (let i = 0; i < n; i++) {
    for (let k = 1; k <= half; k++) {
      matches.push({ a: i, b: (i + k) % n });
    }
  }

  // Randomize match order and which game shows on the left so position isn't biased.
  return shuffled(matches).map((m) =>
    Math.random() < 0.5 ? m : { a: m.b, b: m.a },
  );
}

/**
 * Dev/test helper: verify every game has exactly MATCHUPS_PER_GAME matchups and
 * that no unordered pair repeats. Returns an error string, or null if valid.
 */
export function validateMatches(games: Game[], matches: Match[]): string | null {
  const n = games.length;
  const degree = new Array<number>(n).fill(0);
  const seen = new Set<string>();
  for (const { a, b } of matches) {
    if (a === b) return `self-match at game ${a}`;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return `duplicate matchup ${key}`;
    seen.add(key);
    degree[a]++;
    degree[b]++;
  }
  for (let i = 0; i < n; i++) {
    if (degree[i] !== MATCHUPS_PER_GAME) {
      return `game ${i} has ${degree[i]} matchups, expected ${MATCHUPS_PER_GAME}`;
    }
  }
  return null;
}
