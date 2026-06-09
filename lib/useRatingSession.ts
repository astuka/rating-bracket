"use client";

import { useCallback, useEffect, useState } from "react";
import { Game, Match, Phase, SessionState } from "./types";
import { generateMatches } from "./matchmaking";

const STORAGE_KEY = "rating-bracket-session-v1";

const EMPTY: SessionState = {
  phase: "draft",
  draft: [],
  matches: [],
  winners: [],
};

function load(): SessionState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as SessionState;
    // Minimal shape guard so a stale/corrupt blob can't crash the app.
    if (!parsed || !Array.isArray(parsed.draft)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

export function useRatingSession() {
  const [state, setState] = useState<SessionState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  // Persist on every change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — non-fatal.
    }
  }, [state, hydrated]);

  const addGame = useCallback((game: Game) => {
    setState((s) =>
      s.draft.some((g) => g.id === game.id)
        ? s
        : { ...s, draft: [...s.draft, game] },
    );
  }, []);

  const removeGame = useCallback((id: number) => {
    setState((s) => ({ ...s, draft: s.draft.filter((g) => g.id !== id) }));
  }, []);

  const startMatches = useCallback(() => {
    setState((s) => {
      const matches = generateMatches(s.draft);
      return {
        ...s,
        phase: "match",
        matches,
        winners: new Array<number | null>(matches.length).fill(null),
      };
    });
  }, []);

  const recordWinner = useCallback((matchIndex: number, winnerId: number) => {
    setState((s) => {
      const winners = s.winners.slice();
      winners[matchIndex] = winnerId;
      const allDone = winners.every((w) => w !== null);
      return { ...s, winners, phase: allDone ? "results" : s.phase };
    });
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  return {
    state,
    hydrated,
    addGame,
    removeGame,
    startMatches,
    recordWinner,
    reset,
  };
}

export type { Game, Match, Phase, SessionState };
