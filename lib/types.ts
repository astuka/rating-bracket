export interface Game {
  /** IGDB game id */
  id: number;
  name: string;
  summary: string;
  /** Built cover image URL, or null if IGDB had no cover. */
  coverUrl: string | null;
}

export interface Match {
  /** Index into the draft list for the first game. */
  a: number;
  /** Index into the draft list for the second game. */
  b: number;
}

export type Phase = "draft" | "match" | "results";

export interface SessionState {
  phase: Phase;
  /** The games chosen during drafting. Indices in `matches` refer to this list. */
  draft: Game[];
  /** Generated matchups, in presentation order. Empty until matching starts. */
  matches: Match[];
  /** Winner per match, parallel to `matches`. winner is the game id, or null if unplayed. */
  winners: (number | null)[];
}

export const MATCHUPS_PER_GAME = 10;
export const MIN_GAMES = MATCHUPS_PER_GAME + 1; // 11
