import { NextRequest, NextResponse } from "next/server";
import { bulkSearchGames, IgdbConfigError } from "@/lib/igdb";
import { BULK_SEARCH_BATCH_SIZE } from "@/lib/csv";

// Always run on the server; never statically optimize this route.
export const dynamic = "force-dynamic";

// Searches are paced at ~4/s for IGDB's rate limit, so big batches run long.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let queries: string[];
  try {
    const body = (await req.json()) as { queries?: unknown };
    if (
      !Array.isArray(body.queries) ||
      !body.queries.every((q): q is string => typeof q === "string")
    ) {
      throw new Error();
    }
    queries = body.queries;
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON body like { queries: string[] }." },
      { status: 400 },
    );
  }

  if (queries.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (queries.length > BULK_SEARCH_BATCH_SIZE) {
    return NextResponse.json(
      { error: `At most ${BULK_SEARCH_BATCH_SIZE} games per request — send larger imports in batches.` },
      { status: 400 },
    );
  }

  try {
    const games = await bulkSearchGames(queries);
    // Results stay aligned with the submitted queries, one entry per query.
    const results = queries.map((query, i) => ({ query, games: games[i] }));
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof IgdbConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown IGDB error.";
    console.error("IGDB bulk search error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
