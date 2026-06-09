import { NextRequest, NextResponse } from "next/server";
import { searchGames, IgdbConfigError } from "@/lib/igdb";

// Always run on the server; never statically optimize this route.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ games: [] });
  }

  try {
    const games = await searchGames(query);
    return NextResponse.json({ games });
  } catch (err) {
    if (err instanceof IgdbConfigError) {
      // Misconfiguration is the user's setup problem, not a transient failure.
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown IGDB error.";
    console.error("IGDB search error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
