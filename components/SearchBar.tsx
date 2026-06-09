"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@/lib/types";

interface Props {
  onPick: (game: Game) => void;
  /** Ids already in the draft, to dim them in the dropdown. */
  chosenIds: Set<number>;
}

export default function SearchBar({ onPick, chosenIds }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Search failed.");
          setResults([]);
        } else {
          setResults(data.games as Game[]);
          setOpen(true);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Search failed.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(game: Game) {
    onPick(game);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search for a game…"
        className="w-full rounded-lg border border-white/15 bg-panel px-4 py-3 text-base outline-none placeholder:text-white/40 focus:border-accent focus:ring-2 focus:ring-accent"
      />

      {loading && (
        <span className="absolute right-4 top-3.5 text-sm text-white/40">…</span>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-2 max-h-96 w-full overflow-auto rounded-lg border border-white/15 bg-panel shadow-xl">
          {results.map((g) => {
            const chosen = chosenIds.has(g.id);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  disabled={chosen}
                  onClick={() => pick(g)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/5 disabled:opacity-40"
                >
                  {g.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.coverUrl}
                      alt=""
                      className="h-12 w-9 flex-none rounded object-cover"
                    />
                  ) : (
                    <span className="h-12 w-9 flex-none rounded bg-black/40" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{g.name}</span>
                    {chosen && (
                      <span className="text-xs text-accent">already added</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
