"use client";

import { Game } from "@/lib/types";

interface Props {
  game: Game;
  onClick?: () => void;
  /** Renders as a clickable button when an onClick is provided. */
  interactive?: boolean;
}

export default function GameCard({ game, onClick, interactive }: Props) {
  const inner = (
    <>
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/40">
        {game.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.coverUrl}
            alt={`${game.name} cover art`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-white/40">
            No cover art
          </div>
        )}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">{game.name}</h3>
      {game.summary && (
        <p className="mt-1 line-clamp-4 text-sm text-white/60">{game.summary}</p>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full flex-col rounded-xl border border-white/10 bg-panel p-3 text-left transition hover:border-accent hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col rounded-xl border border-white/10 bg-panel p-3">
      {inner}
    </div>
  );
}
