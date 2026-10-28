# Puzzle #40 — live product changelog via Supabase Realtime (no redeploy)

Brief (Task Forge puzzle tracker): live product changelog via Supabase realtime (no redeploy) — Supabase.

A changelog page that updates **live** — insert a new entry in the database and
it appears on every open page instantly, with no page reload and no site
redeploy. That decoupling of content from deploys is the whole point.

## How it works

- A real Supabase table `puzzle40_changelog` (public-read RLS) is added to the
  `supabase_realtime` publication.
- `app.js` loads existing entries once, then opens a Supabase Realtime channel
  subscribed to `postgres_changes` (INSERT) on that table. A new row triggers
  the handler, which prepends the entry with a flash highlight — no reload.
- Writes happen out-of-band (SQL, the Supabase dashboard, or an admin tool);
  there is **no anon write policy** — the page is read + subscribe only.

## Verified live (the actual mechanic, not just that it renders)

With the page open and subscribed in a real browser (claude-in-chrome):

1. Confirmed the channel reached `SUBSCRIBED` (console: `[realtime] subscribe
   status: SUBSCRIBED`), status pill went green ("live — subscribed to
   realtime updates").
2. Inserted a new row **via SQL** (`INSERT INTO puzzle40_changelog ...`) while
   the page stayed open — no reload, no redeploy.
3. The page received the push live (console: `[realtime] INSERT received:
   v2.5.0`) and the new entry appeared **at the top with the flash
   animation** — verified in the DOM: `top_title: "Second realtime test"`,
   `top_flashed: true`, entry count went up without a navigation.

(Debug `console.log`s used for that verification were removed from the shipped
`app.js`; the test rows were deleted afterward, leaving the 3 seed entries.)

## Security

- Read-only RLS for `anon`; the anon key in `app.js` is the publishable key
  (safe to ship). No anon writes.
- All DB-sourced fields are injected via `textContent` (never `innerHTML`) and
  the entry type is whitelisted, so no changelog field can inject markup.

## Deploy

`wrangler.jsonc` included (static Worker). Public deploy pending the same
one-time `wrangler login` as puzzles #35/#39. The page is fully functional
served from any static host (verified locally).
