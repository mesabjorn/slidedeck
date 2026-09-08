# AGENTS.md

Guide for AI agents working in this repository.

## Project overview

SlideDeck is a slide presentation app: a React 19 + TypeScript + Tailwind CSS v4 client backed by a small Node/Express server. The server owns all presentation content (markdown under `server/content/`), parses it into slide JSON, and serves it over a tiny JSON API. No build-time content step.

## Commands

- `npm run dev` — start the Express API (port 3001) and the Vite dev server (port 5173) together
- `npm run dev:client` — Vite dev server only (API must be running separately)
- `npm run dev:server` — Express server with `--watch`
- `npm run build` — type-check (`tsc -b`) then build (`vite build` → `dist/`)
- `npm run lint` — run oxlint
- `npm run start` — production: run Express, which serves `dist/` and the API
- `npm run preview` — preview the production build

Always run `npm run lint` and `npm run build` after making changes.

## Architecture

Content flows: files on disk -> Express API -> fetch -> render (no client-side markdown parsing).

1. `server/content/presentations.json` lists decks as `{ id, title, description }`.
2. Each deck lives under `server/content/<id>/` with:
   - `slides/index.json` — ordered array of slide filenames (e.g. `["01-intro.md"]`)
   - `slides/*.md` — one markdown file per slide, see format below
   - optional `images/` folder for local media
   - optional `data/*.csv` folder for chart datasets
3. The Express server (`server/index.js`) exposes:
   - `GET /api/presentations` — deck list, each with a `slideCount`
   - `GET /api/presentations/:id/slides` — parsed slides for a deck (media paths resolved to `/api/...`, chart CSVs parsed inline)
   - `GET /api/presentations/:id/images/*` — local media files
   - `GET /api/presentations/:id/data/*` — CSV files parsed to `{ columns, rows }`
   In production it also serves the built client from `dist/`.
4. In dev, Vite proxies `/api` to `http://localhost:3001` (`vite.config.ts`).
5. `usePresentations` fetches the deck list; `useSlides(<id>)` fetches parsed slides.
6. `App` renders `PresentationPicker` (deck chooser) or `SlideDeck` (presentation UI).

Key files:

- `server/index.js` — Express app: JSON API + image/data serving + static `dist/` fallback
- `server/markdown.js` — markdown parser + media path resolution (the only markdown logic)
- `server/csv.js` — CSV parser + chart data conversion
- `server/content/` — all presentation content (decks, slides, images, data)
- `src/App.tsx` — top-level state: picker vs. deck, loading/error handling
- `src/hooks/usePresentations.ts` — loads deck list from `/api/presentations`
- `src/hooks/useSlides.ts` — loads parsed slides from `/api/presentations/:id/slides`
- `src/lib/types.ts` — shared types: `Slide`, `SlideImage`, `Chart`, `PresentationMeta`
- `src/components/SlideDeck.tsx` — navigation, keyboard shortcuts, fullscreen, overview grid, help modal
- `src/components/SlideView.tsx` — renders one slide (including charts)
- `src/components/InlineText.tsx` — renders inline markdown (bold, italic, code, links, tooltips, inline images)
- `src/components/ChartView.tsx` — hand-rolled SVG bar/line/pie charts with hover tooltips
- `src/components/Tooltip.tsx` — tooltip popover + inline tooltip component
- `src/components/PresentationPicker.tsx` — deck chooser using server-provided slide counts

## Slide markdown format

Slides are separated by `---`. Parser rules in `server/markdown.js`:

- `# Title` — slide title (first one wins)
- `## Subtitle` — subtitle line(s), joined with a space
- `![alt](path)` — block image (first one wins)
- `![chart:bar](data/sales.csv)` / `chart:line` / `chart:pie` — block chart; data from a CSV under `data/` or inline: `![chart:pie](inline:Q1,Q2;10,15)`
- `- item` / `* item` / `1. item` — bullet items (both bullets and numbered collapse into `items`)
- Any other non-`#`/`>` line — appended to subtitle
- Inline markdown inside titles/subtitles/items: `**bold**`, `*italic*`, `` `code` ``, `[text](url)`, `[text](tooltip:hint)`, `![alt](src)`

## Chart data

- CSV convention: first header cell names the label column; remaining columns become series; each row is `label,value[,value…]`. `server/csv.js` coerces numeric cells to numbers.
- The slides API inlines parsed chart data as `{ labels, series: [{ name, values }] }`, so the client never fetches CSVs.
- Inline syntax `inline:Label1,Label2;v1,v2` produces a single `value` series.

## Media path resolution

The server resolves image paths so the client never touches the filesystem. In `server/markdown.js`, relative paths are prefixed with the API route, so `![x](images/foo.svg)` inside deck `presentation1` becomes `/api/presentations/presentation1/images/foo.svg`. Absolute URLs, `data:` URIs, and paths starting with `/` are left untouched; paths already prefixed with `<deckId>/` are normalized.

## Conventions

- Styling is Tailwind utility classes; no standalone CSS modules.
- Colors are semantic tokens (`--color-bg`, `--color-accent`, `--color-panel`, …) generated from `@theme` in `src/index.css`, with per-palette overrides on `:root[data-theme='…']`. The palette list and selection live in `src/lib/themes.ts`, `src/hooks/useTheme.ts` (localStorage + `data-theme`), and `src/components/ThemeSwitcher.tsx` (picker + deck header). New palettes need both a `[data-theme]` block in `index.css` and an entry in `THEMES`.
- Icons come from `lucide-react`.
- React Compiler/Babel preset is enabled (`vite.config.ts`) — follow rules-of-hooks; oxlint enforces this.
- Server code is plain ESM JavaScript (`"type": "module"`), no build step.
- No test framework is configured.