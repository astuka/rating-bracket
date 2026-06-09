# Rating Bracket

A fun way to "rate" things you've watched / read / played — starting with **games**.
Instead of guessing a number, you pick favorites in head-to-head matchups and the
app turns your wins into a score out of 10.

## How it works

1. **Draft** — search IGDB and add at least **11 games** (cover art, title, summary).
2. **Match** — the app builds matchups so every game appears in **exactly 10**
   unique head-to-heads (no repeats). You pick a winner in each one.
3. **Results** — each game's score = matchups won (0 wins → 0, 10 wins → 10),
   ranked highest first.

Your progress is saved in the browser (`localStorage`), so a refresh resumes where
you left off. There are no accounts and no database.

## Setup

IGDB's API is authenticated through Twitch, so you need a free Twitch developer app.

1. Go to <https://dev.twitch.tv/console/apps> and **Register Your Application**.
   - Name: anything (e.g. "rating-bracket")
   - OAuth Redirect URL: `http://localhost:3000`
   - Category: Application Integration
2. Copy the **Client ID**, then **New Secret** to get a **Client Secret**.
   (IGDB v4 uses these Twitch credentials directly.)
3. Configure the app:

   ```bash
   cp .env.example .env.local
   # edit .env.local and paste your TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET
   ```

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open <http://localhost:3000>.

The Client Secret stays on the server — searches go through the
`/api/igdb/search` route, never directly from the browser.

## Tech

- Next.js (App Router) + TypeScript + Tailwind CSS
- Matchmaking is a circulant graph (`lib/matchmaking.ts`) — guarantees exactly 10
  unique matchups per game for any 11+ game list.

## Notes

- 20 games means 100 matchups; the per-game matchup count is fixed at 10 for now.
- The architecture is media-agnostic: swapping in books/movies later mainly touches
  `lib/igdb.ts`, the search route, and the `Game` type.
