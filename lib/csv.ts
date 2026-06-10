/**
 * Maximum queries per bulk-search request. Imports larger than this are sent
 * as sequential batches so one request never outlives serverless time limits.
 */
export const BULK_SEARCH_BATCH_SIZE = 50;

const HEADER_VALUES = new Set([
  "name",
  "title",
  "game",
  "games",
  "game name",
  "game title",
]);

/**
 * Extract game names from CSV text, taking the first column of each record.
 * Handles quoted fields (including embedded commas, quotes, and newlines),
 * skips an obvious header row, and dedupes case-insensitively.
 */
export function parseCsvGameNames(text: string): string[] {
  const records: string[] = [];
  let first = "";
  let inQuotes = false;
  let fieldIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          if (fieldIndex === 0) first += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (fieldIndex === 0) {
        first += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fieldIndex++;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      records.push(first);
      first = "";
      fieldIndex = 0;
    } else if (fieldIndex === 0) {
      first += ch;
    }
  }
  records.push(first);

  const names: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < records.length; index++) {
    const name = records[index].trim();
    if (!name) continue;
    if (index === 0 && HEADER_VALUES.has(name.toLowerCase())) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}
