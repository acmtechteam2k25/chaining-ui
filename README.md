# API Vault Challenge — UI

The contest front end for the API Chaining Challenge. Vite + React 19, Tailwind v4, and shadcn/ui
components (Base UI, `nova` style) in the "Paper & Ink" theme: cream stock, ink type, tan seals,
Manrope for interface text and JetBrains Mono for anything a participant types or reads as data.

## Screens

| Route | Screen | What it does |
|-------|--------|--------------|
| `/` | Join | Shared countdown, participant ID entry, resume for an existing session |
| `/contest` | Play | Step chain, current step and hint, request path input, graded response |
| `/leaderboard` | Leaderboard | Live standings, polled every ten seconds |
| `/admin` | Admin | Secret gate, contest open/close, roster seeding, per-participant controls |

## Running it

```bash
npm install
npm run dev     # http://localhost:5173, proxies API paths to the server on :5000
npm run build   # emits dist/, which the API server serves in production
npm run lint
```

The API server must be running (see `../Api-chaining-Server`). `vite.config.js` proxies `/api`,
`/docs`, `/health`, and every fixture prefix to `VITE_API_TARGET` (default `http://localhost:5000`),
so the app uses same-origin paths in both dev and production. Set `VITE_API_BASE_URL` at build time
only if the UI is hosted somewhere other than the API server.

## How state is kept

- Participant session token → `localStorage` (`apiVault.token`, `apiVault.code`)
- Admin secret → `sessionStorage`, so closing the tab locks the console again
- Everything else lives on the server; the UI re-reads `/api/contest/me` every 15 seconds and never
  stores answers or expected paths

The countdown is anchored to the server clock (`serverNow` vs the local clock), so a participant with
a wrong system time still sees the real remaining time.

## Conventions

- shadcn components in `src/components/ui` are generated — update them with `npx shadcn@latest add`,
  not by hand. ESLint ignores that directory.
- Theme tokens live in `src/index.css`. Use semantic classes (`bg-card`, `text-muted-foreground`)
  rather than raw colors.
- Polling goes through `usePoll` so requests never overlap and nothing is set after unmount.
