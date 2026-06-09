"use client";

import { Game, Match, MATCHUPS_PER_GAME } from "@/lib/types";
import { rankGames } from "@/lib/scoring";

interface Props {
  games: Game[];
  matches: Match[];
  winners: (number | null)[];
  onReset: () => void;
}

export default function Results({ games, matches, winners, onReset }: Props) {
  const ranked = rankGames(games, matches, winners);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your ratings</h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/5"
        >
          Start over
        </button>
      </div>

      <ol className="space-y-2">
        {ranked.map((r) => (
          <li
            key={r.game.id}
            className="flex items-center gap-4 rounded-lg border border-white/10 bg-panel p-3"
          >
            <span className="w-8 flex-none text-center text-lg font-bold text-white/40">
              {r.rank}
            </span>
            {r.game.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.game.coverUrl}
                alt=""
                className="h-16 w-12 flex-none rounded object-cover"
              />
            ) : (
              <span className="h-16 w-12 flex-none rounded bg-black/40" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.game.name}</p>
              <p className="text-xs text-white/50">
                {r.wins} / {MATCHUPS_PER_GAME} matchups won
              </p>
            </div>
            <div className="flex-none text-right">
              <span className="text-2xl font-bold text-accent">{r.score}</span>
              <span className="text-sm text-white/40"> / 10</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
