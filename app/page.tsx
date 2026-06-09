"use client";

import { useMemo } from "react";
import { useRatingSession } from "@/lib/useRatingSession";
import SearchBar from "@/components/SearchBar";
import DraftList from "@/components/DraftList";
import MatchScreen from "@/components/MatchScreen";
import Results from "@/components/Results";

export default function Home() {
  const {
    state,
    hydrated,
    addGame,
    removeGame,
    startMatches,
    recordWinner,
    reset,
  } = useRatingSession();

  const chosenIds = useMemo(
    () => new Set(state.draft.map((g) => g.id)),
    [state.draft],
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Rating <span className="text-accent">Bracket</span>
        </h1>
        <p className="mt-1 text-white/60">
          Draft your games, pick favorites head-to-head, and get a score out of 10.
        </p>
      </header>

      {/* Avoid a hydration flash: wait until localStorage has loaded. */}
      {!hydrated ? (
        <p className="text-white/40">Loading…</p>
      ) : state.phase === "draft" ? (
        <div className="space-y-6">
          <SearchBar onPick={addGame} chosenIds={chosenIds} />
          <DraftList
            games={state.draft}
            onRemove={removeGame}
            onStart={startMatches}
          />
        </div>
      ) : state.phase === "match" ? (
        <MatchScreen
          games={state.draft}
          matches={state.matches}
          winners={state.winners}
          onPick={recordWinner}
        />
      ) : (
        <Results
          games={state.draft}
          matches={state.matches}
          winners={state.winners}
          onReset={reset}
        />
      )}
    </main>
  );
}
