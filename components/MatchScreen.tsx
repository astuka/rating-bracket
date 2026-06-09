"use client";

import { useMemo } from "react";
import { Game, Match } from "@/lib/types";
import GameCard from "./GameCard";

interface Props {
  games: Game[];
  matches: Match[];
  winners: (number | null)[];
  onPick: (matchIndex: number, winnerId: number) => void;
}

export default function MatchScreen({ games, matches, winners, onPick }: Props) {
  // The current match is the first one without a recorded winner.
  const current = useMemo(
    () => winners.findIndex((w) => w === null),
    [winners],
  );

  if (current === -1) return null;

  const played = winners.filter((w) => w !== null).length;
  const total = matches.length;
  const match = matches[current];
  const a = games[match.a];
  const b = games[match.b];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>
            Match {played + 1} of {total}
          </span>
          <span>{Math.round((played / total) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(played / total) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="mb-6 text-center text-lg font-medium text-white/80">
        Which do you like more?
      </h2>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <GameCard
          game={a}
          interactive
          onClick={() => onPick(current, a.id)}
        />
        <div className="hidden items-center justify-center self-center text-sm font-bold text-white/30 sm:flex">
          VS
        </div>
        <GameCard
          game={b}
          interactive
          onClick={() => onPick(current, b.id)}
        />
      </div>
    </div>
  );
}
