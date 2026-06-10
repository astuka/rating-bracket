"use client";

import { useMemo } from "react";
import { useRatingSession } from "@/lib/useRatingSession";
import SearchBar from "@/components/SearchBar";
import BulkImport from "@/components/BulkImport";
import DraftList from "@/components/DraftList";
import MatchScreen from "@/components/MatchScreen";
import Results from "@/components/Results";
import SaveControls from "@/components/SaveControls";

export default function Home() {
  const {
    state,
    hydrated,
    addGame,
    addGames,
    removeGame,
    startMatches,
    recordWinner,
    reset,
    importState,
  } = useRatingSession();

  const chosenIds = useMemo(
    () => new Set(state.draft.map((g) => g.id)),
    [state.draft],
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rating <span className="text-accent">Bracket</span>
          </h1>
          <p className="mt-1 text-white/60">
            Draft your games, pick favorites head-to-head, and get a score out of 10.
          </p>
        </div>
        {hydrated && <SaveControls state={state} onImport={importState} />}
      </header>

      {/* Avoid a hydration flash: wait until localStorage has loaded. */}
      {!hydrated ? (
        <p className="text-white/40">Loading…</p>
      ) : state.phase === "draft" ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <SearchBar onPick={addGame} chosenIds={chosenIds} />
            </div>
            <BulkImport onAdd={addGames} chosenIds={chosenIds} />
          </div>
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
