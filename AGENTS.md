# AGENTS.md

Guide for AI agents working in this repository.

## Project overview

SlideDeck is a slide presentation app: a React 19 + TypeScript + Tailwind CSS v4 client (its own npm package in `client/`) backed by a small Node/Express server. The server owns all presentation content (markdown under `server/content/`), parses it into slide JSON, and serves it over a tiny JSON API. No build-time content step.

Layout at a glance:

```
server/                 Express API + markdown/CSV parsing (plain ESM JS, no build step)
  index.js              routes, path safety, static dist/ serving
  markdown.js           markdown parser + media path resolution
  csv.js                CSV parser + chart-data conversion
  export.js             inlines local images as data: URIs for JSON export
  starter_slides.js     markdown + index.json template for newly created decks
  content/              all presentation content (decks, slides, images, data)
client/                 Vite + React + Tailwind SPA (own package.json)
  src/                  application source
  vite.config.ts        React Compiler preset + /api proxy
README.md               user-facing docs for slides/index.json
```

## Commands

- `npm run dev` — start the Express API (port 3001) and the Vite dev server (port 5173) together
- `npm run dev:client` — Vite dev server only (API must be running separately)
- `npm run dev:server` — Express server with `--watch`
- `npm run build` — build the client (`npm run build --prefix client` → `client/dist/`; this is also the only place `tsc -b` type-checks)
- `npm run lint` — oxlint on `server/` plus oxlint in `client/` (lint does **not** type-check)
- `npm run start` — production: run Express, which serves `client/dist/` and the API
- `npm run preview` — preview the production build

All root scripts delegate into `client/` with `--prefix client`. Always run `npm run lint` and `npm run build` after making changes.

## Architecture

Content flows: files on disk -> Express API -> fetch -> render (no client-side markdown parsing).

1. `server/content/presentations.json` lists decks as `{ id, title, description }`. A deck folder that is not listed here is invisible to the API and the picker.
2. Each deck lives under `server/content/<id>/` with:
   - `slides/index.json` — ordered slide list; always an array of sections `{ name, slides, hidden? }`. Each slide is an object `{ file, hidden?, layout? }`; `hidden: true` slides (or whole sections) are excluded server-side
   - `slides/*.md` — one markdown file per slide, see [Slide markdown format](#slide-markdown-format)
   - optional `images/` folder for local media
   - optional `data/*.csv` folder for chart datasets
3. The Express server (`server/index.js`) exposes:
   - `POST /api/presentations` — create a deck from a title; writes starter slides from `starter_slides.js` and appends to `presentations.json`
   - `GET /api/presentations` — deck list, each with a `slideCount` (visible slides only)
   - `GET /api/presentations/:id/slides` — parsed slides for a deck (media paths resolved to `/api/...`, chart CSVs parsed inline)
   - `GET /api/presentations/:id/export` — same payload as a downloadable `<id>-slides.json`, with local images inlined as `data:` URIs
   - `GET /api/presentations/:id/images/*splat` — local media files
   - `GET /api/presentations/:id/data/*splat` — CSV files parsed to `{ columns, rows }` (not currently fetched by the client; charts are inlined server-side)

   Express 5 is in use, so wildcards use the `*splat` syntax. Deck ids must match `/^[\w.-]+$/`; all file routes resolve paths and reject anything escaping the deck folder. In production the app also serves the built client from `client/dist/` with a SPA fallback, and any unmatched request returns `404 {"error":"Not found"}`.
4. In dev, Vite proxies `/api` to `http://localhost:3001` (`client/vite.config.ts`).
5. `usePresentations` fetches the deck list and can create decks; `useSlides(<id>)` fetches parsed slides.
6. `App` renders `PresentationPicker` (deck chooser) or `SlideDeck` (presentation UI) — there is no router, just state.

### API response shape

Both `/slides` and `/export` return exactly `{ id, slides }`. **Sections are not nested** — they are flattened into one ordered `slides` array and each slide carries a scalar `section` string (the section `name`), which the overview grid regroups by client-side.

```jsonc
{
  "id": "presentation1",
  "slides": [
    {
      "id": "01-intro.md#0",        // `${file}#${index}`
      "title": "Intro",
      "subtitle": "optional",
      "items": ["bullet"],
      "image": { "src": "/api/presentations/presentation1/images/foo.svg", "alt": "…" },
      "charts": [
        { "type": "bar", "data": { "labels": ["Q1"], "series": [{ "name": "Sales", "values": [120] }] } }
      ],
      "references": ["Author A, Author B (2024). Title."],
      "section": "Start"
    },
    {
      "id": "04-layouts.md#layout", // column slides use a `#layout` id and empty top-level items
      "title": "From the first column's heading",
      "items": [],
      "section": "Layouts",
      "columns": [
        { "title": "", "subtitle": "…", "items": ["…"], "image": { }, "charts": [], "references": [], "flex": 1 }
      ]
    }
  ]
}
```

## Key files

### Server

- `server/index.js` — Express app: all routes, path-safety helpers, JSON body parsing, static `dist/` + SPA fallback, catch-all 404
- `server/markdown.js` — markdown parser (`parseSlides`, `parseColumns`) + media path resolution; the only markdown logic
- `server/csv.js` — `parseCsv` (quoted fields, CRLF, numeric coercion) and `csvToChartData`
- `server/export.js` — `compileSlidesExport`: rewrites `/api/.../images/...` sources into base64 `data:` URIs so an exported deck is self-contained
- `server/starter_slides.js` — `STARTER_SLIDES` / `STARTER_INDEX` used by deck creation
- `server/content/` — all presentation content (decks, slides, images, data)

### Frontend

- `client/src/main.tsx` — entry point; calls `applyStoredTheme()` before the first render
- `client/src/App.tsx` — top-level state: picker vs. deck, imported-deck state, JSON import validation (`importPresentation`), imported-deck re-export
- `client/src/index.css` — Tailwind v4 `@theme` semantic tokens, palette overrides, `slide-in` animation
- `client/src/lib/types.ts` — shared types: `Slide`, `SlideColumn`, `SlideImage`, `Chart`, `ChartData`, `PresentationMeta`, `ImportedPresentation` (`references?: string[]` on both `Slide` and `SlideColumn`)
- `client/src/lib/themes.ts` — `Theme`, `THEMES` (the palette list), `ThemeId`
- `client/src/hooks/usePresentations.ts` — loads the deck list; also `createPresentation(title)` → `POST /api/presentations`
- `client/src/hooks/useSlides.ts` — loads parsed slides for a deck id, discarding stale responses
- `client/src/hooks/useTheme.ts` — `useTheme()` + `applyStoredTheme()` (localStorage key `slidedeck-theme`)
- `client/src/components/PresentationPicker.tsx` — deck chooser, "New presentation" modal, "Import JSON" file input
- `client/src/components/SlideDeck.tsx` — navigation, keyboard shortcuts, fullscreen, overview grid + search, help modal, references panel, JSON download
- `client/src/components/SlideView.tsx` — renders one slide, dispatching to the multi-column layout or single-column body
- `client/src/components/InlineText.tsx` — renders inline markdown (bold, italic, code, links, tooltips, inline images)
- `client/src/components/ChartView.tsx` — hand-rolled SVG bar/line/pie charts with hover tooltips (pie has a legend)
- `client/src/components/Tooltip.tsx` — `TooltipBubble` popover + `InlineTooltip` term→hint component
- `client/src/components/ThemeSwitcher.tsx` — palette picker (used in both the picker and the deck header)
- `client/vite.config.ts` — plugins (Tailwind, React, React Compiler via Babel), `base: "./"`, `/api` proxy

## Slide markdown format

Slides are separated by `---`. All parsing lives in `server/markdown.js`; the regexes are the first 10 lines of that file and each rule below cites them.

| Syntax | Regex | Result |
| --- | --- | --- |
| `---` alone on a line | `/^---\s*$/m` | slide break |
| `~~~` alone on a line | `/^~~~\s*$/m` | column break |
| `# Title` | `/^#\s+(.*)$/` | slide/column title, first one wins |
| `## Subtitle` | `/^##\s+(.*)$/` | appended to the subtitle |
| `> Citation` | `/^>\s*(.*)$/` | reference (see below) |
| `![alt](path)` alone on a line | `/^!\[([^\]]*)\]\(([^)\s]+)\)$/` | block image, first one wins |
| `![chart:bar](…)` | alt matched by `/^chart:(\w+)$/` | block chart, may repeat |
| `- ` / `* ` / `+ ` | `/^[-*+]\s+(.*)$/` | bullet item |
| `1. ` / `1) ` | `/^\d+[.)]\s+(.*)$/` | numbered item |
| `![alt](src)` inline | `/!\[([^\]]*)\]\(([^)\s]+)\)/g` | media path rewritten |
| anything else | `/^[#>]/` guard | appended to the subtitle |

Details that bite:

- **Every line is trimmed**, so leading indentation carries no meaning (no nested lists) and CRLF files parse fine.
- **Subtitle lines are joined with a single space**, so multiple `##` lines and loose prose merge into one string.
- **Bullets and numbered items collapse into the same `items` array**; the marker is stripped and nothing records the original ordering type.
- **Block images and charts must be the entire line** — the src cannot contain whitespace or `)`. Multiple charts per slide are fine; only the *first* block image is kept.
- **A column file becomes a layout only if it yields more than one `~~~` block.** `parseColumns` is tried first and `parseSlides` is the fallback, so in a column file a `---` line does *not* start a new slide — it falls through to the subtitle as the literal text `"---"`. Quote it (`- "---" starts a new slide`) to write about it, as `starter_slides.js` does.
- **`layout` in `index.json`** accepts a bare array (`[1, 2, 1]`) or `{ "columns": [...] }`, with numbers or `{ "width": n }` / `{ "flex": n }`; non-positive or non-finite values fall back to `1`, and the weights are applied modulo the number of blocks. Without `layout`, columns split equally.
- **Column slides** collapse into a single API slide: `id` becomes `<file>#layout`, top-level `items` is `[]`, the slide `title` is the first column's `#`, and `columns[0].title` is blanked so it is not repeated. The first block's heading renders full-width above the columns.
- **A `#` line without a space matches no rule and is silently discarded.** Blockquotes are *not* dropped any more — a `>` line is a reference (below).
- Not supported anywhere: `###`+ headings, tables, fenced code blocks, footnote definitions, hard line breaks.

### References (`>`)

A line starting with `>` is a **reference** — a citation for the slide, e.g. `> Author A, Author B (2024). Title. Journal 12(3):45-67.` Before this rule existed, such lines were silently discarded, so `rpa/slides/02-scene.md` and `07-where-projects-break.md` had citations that never rendered.

- Each `>` line is one entry in the `references: string[]` array; an empty `>` yields no entry, so blank spacer lines are harmless.
- References work in ordinary slides *and* in individual column blocks (`SlideColumn.references`).
- The text after `>` is ordinary inline markdown, so `**bold**`, links, tooltips and inline images all work, and inline image paths are resolved like any other text.
- Rendering is a **toggle**, not a visible list: `SlideDeck.tsx` shows a bookmark button in the **footer**, to the right of the next-slide arrow, so it survives fullscreen (the header's button cluster is hidden there). It is disabled when the current slide has no references, and opens a numbered panel anchored above it. The `R` shortcut toggles the same panel; navigating or pressing `Esc` closes it.
- References are inlined on export like every other text field, so a `![…](images/x.svg)` inside a citation becomes a `data:` URI in the exported JSON.


### Inline markdown is rendered client-side

The server only rewrites inline **image** paths. `**bold**`, `*italic*`, `` `code` ``, `[text](url)` and `[text](tooltip:hint)` are passed through verbatim and interpreted by `client/src/components/InlineText.tsx`. Adding a new inline construct therefore means editing that component, not the parser. `[text](tooltip:hint)` renders as an `InlineTooltip`; ordinary links open in a new tab. References go through the same `InlineText`, so citations support all of it.

## Chart data

- CSV convention: first header cell names the label column; remaining columns become series; each row is `label,value[,value…]`. `csvToChartData` emits `{ labels, series: [{ name, values }] }`.
- Non-numeric cells in a CSV become `0`; the inline syntax instead uses `Number()`, so a non-numeric value becomes `NaN`, serializes to JSON `null`, and is skipped by the charts. Keep inline values numeric.
- The slides API inlines parsed chart data, so the client never fetches CSVs; `/data/*splat` exists for ad-hoc use.
- Inline syntax `inline:Label1,Label2;v1,v2` produces a single series named `value`; values may be separated by commas or semicolons (`inline:Q1,Q2,Q3,Q4;28;34;21;17` works too).
- Any `chart:<word>` type is accepted server-side, but `ChartView` only renders `bar`, `line`, and `pie` (anything else falls back to `bar`).
- Charts render inside `SlideView` in a responsive two-column grid; a lone chart spans full width. Pie charts use only `series[0]` and show a legend next to the circle.

## Media path resolution

The server resolves image paths so the client never touches the filesystem. `resolveMediaPath` in `server/markdown.js` leaves `http(s):`, protocol-relative `//`, absolute `/…`, and `data:` URIs untouched; otherwise it strips a leading `./`, a leading `<deckId>/`, and a leading `images/`, then prefixes `/api/presentations/<id>/images/`. So `![x](images/foo.svg)`, `![x](./images/foo.svg)`, and `![x](presentation1/images/foo.svg)` inside deck `presentation1` all resolve to the same URL. Inline images inside titles, subtitles, and items are rewritten too. On export, those same local sources are replaced by base64 `data:` URIs so the file is portable.

## Import and export

Both directions are JSON, and both use the `{ id, slides }` shape from the API, so an exported deck re-imports unchanged.

- **Export**: the download button in the deck header (`SlideDeck.tsx`) fetches `/api/presentations/:id/export` as a blob and saves it as `<id>-slides.json`. For an *imported* deck there is no server round-trip — `App.tsx` serialises `{ id, slides }` client-side instead.
- **Import**: fully client-side. `PresentationPicker` has a hidden `input[type=file]` and an "Import JSON" button; `App.tsx` parses the file, requires a non-empty `slides` array whose entries have string `id`, `title`, and `string[] items`, then keeps the deck in memory. Importing never writes to `server/content/`.
- Nothing uploads or overwrites content on the server. The only write route is `POST /api/presentations`, which scaffolds a new deck folder from `starter_slides.js` and appends to `presentations.json`.
- `importPresentation` deliberately keeps unknown extra properties rather than whitelisting fields, but `charts` contents are not validated — a malformed chart passes import and renders blank. `references` *is* checked as `string[]`.

## Conventions

- Styling is Tailwind utility classes; no standalone CSS modules.
- Colors are semantic tokens (`--color-bg`, `--color-accent`, `--color-panel`, …) generated from `@theme` in `client/src/index.css`, with per-palette overrides on `:root[data-theme='…']`. The palette list and selection live in `client/src/lib/themes.ts`, `client/src/hooks/useTheme.ts` (localStorage + `data-theme`), and `client/src/components/ThemeSwitcher.tsx` (picker + deck header). The five palettes are `midnight`, `dusk`, `forest`, `paper`, `daylight`. New palettes need both a `[data-theme]` block in `index.css` and an entry in `THEMES`.
- Icons come from `lucide-react`.
- Keyboard shortcuts are defined in one place, the `SHORTCUTS` table in `client/src/components/SlideDeck.tsx`, alongside the `window` keydown handler: `→`/`↓`/`PageDown`/`Space`/`Enter` next, `←`/`↑`/`PageUp` previous, `Home`/`End` first/last, `F` fullscreen, `O`/`G` overview, `R` references, `H`/`?` help, `Esc` close overlays. The handler ignores events with modifier keys and all but `Escape` while focus is in a text field. `resetOverlays` closes the overview and the references panel together. When adding a shortcut, update `SHORTCUTS` too.
- React Compiler/Babel preset is enabled (`client/vite.config.ts`) — follow rules-of-hooks; oxlint enforces this.
- Server code is plain ESM JavaScript (`"type": "module"`), no build step.
- No test framework is configured.
