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
2. `src/boards.ts` builds each board as rows of cells. Every row's cell
   widths sum to 744px (`BOARD_W`) — `readme.ts` throws if not.
3. `src/page.ts` is the HTML document: fonts, card CSS, and an in-page
   layout pass that draws chamfered card outlines, the circuit wires between
   cards, and the git graph.
4. `src/render.ts` renders the page per theme (dark/light) × variant, and
   slices it into one PNG per cell:
   - `wire` — the whole cell, wires included; used at ≥1280px, where the
     tiles sit edge to edge and the circuit reconnects.
   - `card` — the bare card plus shadow; used on narrow screens.
5. `src/hero.ts` writes `assets/hero-{dark,light}.svg`: CSS-animated terminal
   with subset fonts embedded (external fonts cannot load in `<img>`).
6. `src/readme.ts` writes `README.md` with `<picture>` elements choosing by
   `prefers-color-scheme` and `min-width: 1280px`.

## Gotchas
- Fallback `<img>` tags carry `width` but no `height`: GitHub applies
  `max-width: 100%` without `height: auto`, so a fixed height squashes.
- No whitespace between tiles in a row, `<br />` between rows.
- Screenshot clips must stay inside the page (x ≥ 0) or Chrome captures the
  wrong region.
- Tile PNGs are regenerated from scratch each run (`assets/tiles` is wiped).

## Commands
```bash
bun install
bun run build     # fetch stats (needs GH_TOKEN in .env/.env.local) + render
bun run dev       # re-render from generated/stats.json, no network
bun run preview   # http://localhost:4173 — GitHub-like preview with theme/device toggles
```

## Key Files
- `src/data.ts` — identity, projects, timeline, socials (edit content here)
- `src/theme.ts` — dark/light tokens
- `folio/fonts`, `folio/media` — vendored fonts, screenshots, logos, mascots
- `assets/` — generated output, committed
- `generated/` — scratch: stats cache, render pages, previews (gitignored)
