import { Game } from "./types";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const GAMES_URL = "https://api.igdb.com/v4/games";
const IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

interface CachedToken {
  token: string;
  /** Epoch ms when this token should be considered expired. */
  expiresAt: number;
}

// Module-level cache. Survives across requests in a warm server process.
let cachedToken: CachedToken | null = null;

export class IgdbConfigError extends Error {}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new IgdbConfigError(
      "Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET. Copy .env.example to .env.local and fill them in.",
    );
  }
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const { clientId, clientSecret } = getCredentials();
  const url = `${TOKEN_URL}?client_id=${encodeURIComponent(
    clientId,
  )}&client_secret=${encodeURIComponent(
    clientSecret,
  )}&grant_type=client_credentials`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Twitch token request failed (${res.status}).`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a minute early to avoid edge-of-expiry failures.
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

interface IgdbGame {
  id: number;
  name: string;
  summary?: string;
  cover?: { image_id?: string };
}

function coverUrl(imageId?: string): string | null {
  return imageId ? `${IMAGE_BASE}/t_cover_big/${imageId}.jpg` : null;
}

/**
 * Search IGDB for games matching `query`. Returns up to `limit` results with the
 * name, summary, and a ready-to-use cover URL.
 */
export async function searchGames(query: string, limit = 8): Promise<Game[]> {
  const { clientId } = getCredentials();
  const token = await getAccessToken();

  // Escape double quotes so the Apicalypse search literal stays valid.
  const safeQuery = query.replace(/"/g, '\\"');
  const body = `search "${safeQuery}"; fields name,summary,cover.image_id; where cover != null; limit ${limit};`;

  const res = await fetch(GAMES_URL, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body,
  });

  if (res.status === 401) {
    // Token may have been revoked; drop the cache so the next call refreshes.
    cachedToken = null;
    throw new Error("IGDB rejected the access token (401).");
  }
  if (!res.ok) {
    throw new Error(`IGDB search failed (${res.status}).`);
  }

  const rows = (await res.json()) as IgdbGame[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    summary: row.summary ?? "",
    coverUrl: coverUrl(row.cover?.image_id),
  }));
}

/**
 * Run one search per query, pacing request starts to stay under IGDB's
 * 4-requests-per-second limit. A failed search yields an empty array for
 * that query rather than failing the whole batch.
 */
export async function bulkSearchGames(
  queries: string[],
  limitPerQuery = 5,
): Promise<Game[][]> {
  const START_GAP_MS = 280;
  let nextStart = Date.now();

  return Promise.all(
    queries.map(async (query) => {
      const wait = nextStart - Date.now();
      nextStart = Math.max(nextStart, Date.now()) + START_GAP_MS;
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (query.trim().length < 2) return [];
      try {
        return await searchGames(query, limitPerQuery);
      } catch (err) {
        // Config errors affect every query equally; surface those.
        if (err instanceof IgdbConfigError) throw err;
        console.error(`IGDB bulk search failed for "${query}":`, err);
        return [];
      }
    }),
  );
}
