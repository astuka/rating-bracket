"use client";

import { useRef, useState } from "react";
import { SessionState } from "@/lib/types";
import { exportSession, parseSaveFile } from "@/lib/saveFile";

interface Props {
  state: SessionState;
  onImport: (state: SessionState) => void;
}

export default function SaveControls({ state, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const hasProgress = state.draft.length > 0;

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const imported = parseSaveFile(await file.text());
      if (
        hasProgress &&
        !window.confirm(
          "Importing this save will replace your current progress. Continue?",
        )
      ) {
        return;
      }
      onImport(imported);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasProgress}
          onClick={() => exportSession(state)}
          title="Download your progress as a JSON save file"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition enabled:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Export save
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          title="Restore progress from a JSON save file"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/5"
        >
          Import save
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            // Reset so picking the same file again re-fires onChange.
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
