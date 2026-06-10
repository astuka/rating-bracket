"use client";

import { useRef, useState } from "react";
import { Game } from "@/lib/types";
import { parseCsvGameNames, BULK_SEARCH_BATCH_SIZE } from "@/lib/csv";

interface Props {
  onAdd: (games: Game[]) => void;
  /** Ids already in the draft, to flag them among the candidates. */
  chosenIds: Set<number>;
}

interface ReviewRow {
  /** Stable key; rows never reorder but queries can repeat after edits. */
  key: number;
  /** The name as imported from the CSV. */
  query: string;
  /** Current text in this row's re-search box. */
  searchText: string;
  searching: boolean;
  candidates: Game[];
  /** Selected game id, or null to skip this row. */
  selected: number | null;
}

type Stage = "idle" | "searching" | "review";

function defaultSelection(candidates: Game[], chosenIds: Set<number>) {
  return candidates.find((g) => !chosenIds.has(g.id))?.id ?? null;
}

export default function BulkImport({ onAdd, chosenIds }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const close = () => {
    setStage("idle");
    setRows([]);
  };

  const handleFile = async (file: File) => {
    setError(null);
    const names = parseCsvGameNames(await file.text());
    if (names.length === 0) {
      setError("No game names found in that CSV. Put one name per row in the first column.");
      return;
    }

    setStage("searching");
    setProgress({ done: 0, total: names.length });
    try {
      const results: { query: string; games: Game[] }[] = [];
      for (let i = 0; i < names.length; i += BULK_SEARCH_BATCH_SIZE) {
        const batch = names.slice(i, i + BULK_SEARCH_BATCH_SIZE);
        const res = await fetch("/api/igdb/bulk-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries: batch }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed.");
        results.push(...(data.results as { query: string; games: Game[] }[]));
        setProgress({ done: results.length, total: names.length });
      }

      setRows(
        results.map((r, i) => ({
          key: i,
          query: r.query,
          searchText: r.query,
          searching: false,
          candidates: r.games,
          selected: defaultSelection(r.games, chosenIds),
        })),
      );
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setStage("idle");
    }
  };

  const updateRow = (key: number, patch: Partial<ReviewRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const research = async (row: ReviewRow) => {
    const q = row.searchText.trim();
    if (q.length < 2) return;
    updateRow(row.key, { searching: true });
    try {
      const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed.");
      const candidates = data.games as Game[];
      updateRow(row.key, {
        searching: false,
        candidates,
        selected: defaultSelection(candidates, chosenIds),
      });
    } catch {
      updateRow(row.key, { searching: false });
    }
  };

  const confirm = () => {
    const picked = rows.flatMap((r) => {
      const game = r.candidates.find((g) => g.id === r.selected);
      return game ? [game] : [];
    });
    onAdd(picked);
    close();
  };

  const selectedCount = rows.filter((r) => r.selected !== null).length;

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        title="Import a list of game names from a CSV (first column)"
        className="flex-none rounded-lg border border-white/15 px-4 py-3 text-sm transition hover:bg-white/5"
      >
        Import CSV
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Reset so picking the same file again re-fires onChange.
          e.target.value = "";
        }}
      />
      {error && stage === "idle" && (
        <p className="w-full text-sm text-red-400">{error}</p>
      )}

      {stage === "searching" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="rounded-xl border border-white/15 bg-panel px-8 py-6 text-center">
            <p className="font-medium">
              Searching IGDB… {progress.done} / {progress.total}
            </p>
            <p className="mt-1 text-sm text-white/50">
              This can take a moment for long lists.
            </p>
          </div>
        </div>
      )}

      {stage === "review" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/15 bg-panel">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">Confirm imported games</h2>
              <p className="mt-0.5 text-sm text-white/50">
                Pick the right match for each name, or skip ones you don&apos;t want.
              </p>
            </div>

            <ul className="flex-1 divide-y divide-white/10 overflow-y-auto px-5">
              {rows.map((row) => (
                <li key={row.key} className="py-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{row.query}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.searchText}
                        onChange={(e) =>
                          updateRow(row.key, { searchText: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void research(row);
                        }}
                        placeholder="Search again…"
                        className="w-44 rounded-md border border-white/15 bg-black/20 px-2 py-1 text-sm outline-none placeholder:text-white/40 focus:border-accent"
                      />
                      <button
                        type="button"
                        disabled={row.searching}
                        onClick={() => void research(row)}
                        className="rounded-md border border-white/15 px-2.5 py-1 text-sm transition enabled:hover:bg-white/5 disabled:opacity-40"
                      >
                        {row.searching ? "…" : "Search"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(row.key, { selected: null })}
                        className={`rounded-md px-2.5 py-1 text-sm transition ${
                          row.selected === null
                            ? "bg-white/15 text-white"
                            : "border border-white/15 text-white/60 hover:bg-white/5"
                        }`}
                      >
                        Skip
                      </button>
                    </div>
                  </div>

                  {row.candidates.length === 0 ? (
                    <p className="text-sm text-amber-400">
                      No matches found — try the search box above.
                    </p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {row.candidates.map((g) => {
                        const alreadyAdded = chosenIds.has(g.id);
                        const selected = row.selected === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() =>
                              updateRow(row.key, {
                                selected: selected ? null : g.id,
                              })
                            }
                            title={g.name}
                            className={`w-20 flex-none rounded-md p-1 text-left transition ${
                              selected
                                ? "bg-accent/20 ring-2 ring-accent"
                                : "hover:bg-white/5"
                            } disabled:opacity-40`}
                          >
                            {g.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={g.coverUrl}
                                alt={`${g.name} cover`}
                                className="aspect-[3/4] w-full rounded object-cover"
                              />
                            ) : (
                              <span className="flex aspect-[3/4] w-full items-center justify-center rounded bg-black/40 p-1 text-center text-[10px] text-white/40">
                                {g.name}
                              </span>
                            )}
                            <span className="mt-1 block truncate text-[11px] text-white/70">
                              {alreadyAdded ? "already added" : g.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
              <p className="text-sm text-white/50">
                {selectedCount} of {rows.length} selected
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={confirm}
                  className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add {selectedCount} {selectedCount === 1 ? "game" : "games"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
