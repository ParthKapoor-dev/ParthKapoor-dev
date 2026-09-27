# AGENT.md

## Project Overview
Generator for the **ParthKapoor-dev GitHub profile README**. The README is one
centred paragraph of images: an animated SVG terminal hero, then "boards" of
cards (projects, live GitHub telemetry, a `git log` career timeline, contact)
joined by a continuous circuit. Design tokens, fonts and imagery come from
devport (parthkapoor.me), vendored into `folio/`.

## Tech Stack
- **Runtime**: Bun · **Language**: TypeScript
- **Rendering**: Puppeteer (cards → PNG), hand-written SVG (hero), `subset-font`
- **API**: GitHub GraphQL (`graphql-request`)
- **Automation**: GitHub Actions, every 12 hours

## How it works
1. `src/stats.ts` fetches stats: contribution calendar, streaks, stars per
   repo, languages by bytes (public, non-fork, owned repos).
2. `src/boards.ts` builds each board as rows of cells. Every tile has a
   desktop face (rows fill 744px) and a mobile face (rows fill 280px);
   `checkBoards` throws if a row doesn't fill its layout. Rows are identical
   in both layouts because the README breaks rows with `<br>`.
3. `src/page.ts` is the HTML document: fonts, card CSS, and an in-page
   layout pass that draws chamfered card outlines, the circuit wires between
   cards, and the git graph.
4. `src/render.ts` renders the page per layout (desktop 2×, mobile 3×) ×
   theme (dark/light), and slices it into one PNG per cell, wires included.
5. `src/hero.ts` writes `assets/hero-{desktop,mobile}-{dark,light}.svg`:
   CSS-animated terminal with subset fonts embedded (external fonts cannot
   load in `<img>`).
6. `src/readme.ts` writes `README.md`; each `<picture>` has three tiers:
   ≥1280px desktop, ≥768px mobile at 1.5×, else mobile at 1×, each by
   `prefers-color-scheme`.

## Gotchas
- Mobile tiers carry `width` but no `height`: GitHub applies
  `max-width: 100%` without `height: auto`, so a fixed height squashes.
- The mobile layout is 280px so a row still fits GitHub's column on a
  360px phone; below that, rows wrap.
- No whitespace between tiles in a row, `<br />` between rows.
- Tile PNGs are regenerated from scratch each run (`assets/tiles` is wiped).

## Commands
```bash
bun install
bun run build     # fetch stats (needs GH_TOKEN in .env/.env.local) + render
bun run dev       # re-render from generated/stats.json, no network
bun run preview   # http://localhost:4173 — GitHub-like preview, theme + desktop/tablet/phone
```

## Key Files
- `src/data.ts` — identity, projects, timeline, socials (edit content here)
- `src/theme.ts` — dark/light tokens
- `folio/fonts`, `folio/media` — vendored fonts, screenshots, logos, mascots
- `assets/` — generated output, committed
- `generated/` — scratch: stats cache, render pages, previews (gitignored)
