import { Game, Match, Phase, SessionState } from "./types";

/**
 * Versioned envelope written to exported save files, so future format
 * changes can be migrated instead of rejected.
 */
interface SaveFile {
  app: typeof SAVE_APP;
  version: typeof SAVE_VERSION;
  exportedAt: string;
  state: SessionState;
}

const SAVE_APP = "rating-bracket";
const SAVE_VERSION = 1;

export function exportSession(state: SessionState): void {
  const file: SaveFile = {
    app: SAVE_APP,
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rating-bracket-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate a save file's text. Returns the contained session
 * state, or throws an Error with a user-presentable message.
 */
export function parseSaveFile(text: string): SessionState {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!isRecord(raw) || raw.app !== SAVE_APP) {
    throw new Error("That file doesn't look like a Rating Bracket save.");
  }
  if (raw.version !== SAVE_VERSION) {
    throw new Error(
      `Unsupported save version (${String(raw.version)}). This app reads version ${SAVE_VERSION}.`,
    );
  }
  if (!isSessionState(raw.state)) {
    throw new Error("The save file is damaged or incomplete.");
  }
  return raw.state;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isGame(v: unknown): v is Game {
  return (
    isRecord(v) &&
    typeof v.id === "number" &&
    typeof v.name === "string" &&
    typeof v.summary === "string" &&
    (v.coverUrl === null || typeof v.coverUrl === "string")
  );
}

function isMatch(v: unknown, draftLength: number): v is Match {
  return (
    isRecord(v) &&
    typeof v.a === "number" &&
    typeof v.b === "number" &&
    Number.isInteger(v.a) &&
    Number.isInteger(v.b) &&
    v.a >= 0 &&
    v.a < draftLength &&
    v.b >= 0 &&
    v.b < draftLength
  );
}

const PHASES: Phase[] = ["draft", "match", "results"];

function isSessionState(v: unknown): v is SessionState {
  if (!isRecord(v)) return false;
  if (!PHASES.includes(v.phase as Phase)) return false;
  if (!Array.isArray(v.draft) || !v.draft.every(isGame)) return false;
  const draftLength = v.draft.length;
  if (!Array.isArray(v.matches) || !v.matches.every((m) => isMatch(m, draftLength))) {
    return false;
  }
  if (
    !Array.isArray(v.winners) ||
    v.winners.length !== v.matches.length ||
    !v.winners.every((w) => w === null || typeof w === "number")
  ) {
    return false;
  }
  return true;
}
