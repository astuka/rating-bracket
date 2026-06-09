"use client";

import { Game, MIN_GAMES, MATCHUPS_PER_GAME } from "@/lib/types";

interface Props {
  games: Game[];
  onRemove: (id: number) => void;
  onStart: () => void;
}

export default function DraftList({ games, onRemove, onStart }: Props) {
  const count = games.length;
  const ready = count >= MIN_GAMES;
  const remaining = MIN_GAMES - count;
  const totalMatches = count * (MATCHUPS_PER_GAME / 2);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          {count} {count === 1 ? "game" : "games"} drafted
          {ready ? (
            <span className="text-white/40">
              {" "}
              · {totalMatches} matchups to play
            </span>
          ) : (
            <span className="text-amber-400">
              {" "}
              · add {remaining} more to start
            </span>
          )}
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={onStart}
          className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start rating →
        </button>
      </div>

      {count === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 p-8 text-center text-white/40">
          Search above to draft at least {MIN_GAMES} games.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((g) => (
            <li
              key={g.id}
              className="relative overflow-hidden rounded-lg border border-white/10 bg-panel"
            >
              {g.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.coverUrl}
                  alt={`${g.name} cover`}
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-black/40 p-2 text-center text-xs text-white/40">
                  {g.name}
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                aria-label={`Remove ${g.name}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/80 transition hover:bg-red-600 hover:text-white"
              >
                ×
              </button>
              <p className="truncate px-2 py-1.5 text-xs text-white/70">
                {g.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
