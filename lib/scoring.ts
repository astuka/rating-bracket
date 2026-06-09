import { Game, Match, MATCHUPS_PER_GAME } from "./types";

export interface RankedGame {
  game: Game;
  wins: number;
  /** Score out of 10: wins out of MATCHUPS_PER_GAME. */
  score: number;
  rank: number;
}

/**
 * Tally wins per game and produce a ranked list.
 *
 * Score = wins (0 wins -> 0, 10 wins -> 10). Ties on wins are broken by
 * head-to-head: if exactly one of the tied games beat the other directly, that
 * game ranks higher. Otherwise order is left stable (draft order).
 */
export function rankGames(
  games: Game[],
  matches: Match[],
  winners: (number | null)[],
): RankedGame[] {
  const winsById = new Map<number, number>();
  for (const g of games) winsById.set(g.id, 0);

  // Record head-to-head outcomes by game id pair.
  const beat = new Set<string>(); // `${winnerId}>${loserId}`
  matches.forEach((m, idx) => {
    const winnerId = winners[idx];
    if (winnerId == null) return;
    winsById.set(winnerId, (winsById.get(winnerId) ?? 0) + 1);
    const loserId = winnerId === games[m.a].id ? games[m.b].id : games[m.a].id;
    beat.add(`${winnerId}>${loserId}`);
  });

  const ordered = games
    .map((game) => {
      const wins = winsById.get(game.id) ?? 0;
      return { game, wins, score: wins, rank: 0 };
    })
    .sort((x, y) => {
      if (y.wins !== x.wins) return y.wins - x.wins;
      // Head-to-head tiebreak.
      const xBeatY = beat.has(`${x.game.id}>${y.game.id}`);
      const yBeatX = beat.has(`${y.game.id}>${x.game.id}`);
      if (xBeatY && !yBeatX) return -1;
      if (yBeatX && !xBeatY) return 1;
      return 0; // stable: keep draft order
    });

  ordered.forEach((r, i) => {
    r.rank = i + 1;
  });
  return ordered;
}

export { MATCHUPS_PER_GAME };
