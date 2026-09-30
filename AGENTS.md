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
      "icon": "rocket",
      "section": "Start",
      "reveal": [                     // :::click steps, revealed on click
        { "text": "caption", "image": { "src": "…" }, "items": [], "charts": [] }
      ]
    },
    {
      "id": "04-layouts.md#layout", // column slides use a `#layout` id and empty top-level items
      "title": "From the first column's heading",
      "items": [],
      "section": "Layouts",
      "columns": [
        { "title": "", "subtitle": "…", "items": ["…"], "image": { }, "charts": [], "references": [], "icon": "zap", "flex": 1 }
      ]
    }
  ]
}
```

## Key files

### Server

- `server/index.js` — Express app: all routes, path-safety helpers, JSON body parsing, `resolveCharts` (CSV or `inline:`) and `resolveReveal` (media paths in `:::click` steps), static `dist/` + SPA fallback, catch-all 404
- `server/markdown.js` — markdown parser (`parseSlides`, `parseColumns`, `addRevealLine` for `:::click` steps) + media path resolution; the only markdown logic
- `server/csv.js` — `parseCsv` (quoted fields, CRLF, numeric coercion) and `csvToChartData`
- `server/export.js` — `compileSlidesExport`: rewrites `/api/.../images/...` sources into base64 `data:` URIs so an exported deck is self-contained
- `server/starter_slides.js` — `STARTER_SLIDES` / `STARTER_INDEX` used by deck creation
- `server/content/` — all presentation content (decks, slides, images, data)

### Frontend

- `client/src/main.tsx` — entry point; calls `applyStoredTheme()` before the first render
- `client/src/App.tsx` — top-level state: picker vs. deck, imported-deck state, JSON import validation (`importPresentation`), imported-deck re-export
- `client/src/index.css` — Tailwind v4 `@theme` semantic tokens, palette overrides, `slide-in` animation
- `client/src/lib/types.ts` — shared types: `Slide`, `SlideColumn`, `SlideRevealStep`, `SlideImage`, `Chart`, `ChartData`, `PresentationMeta`, `ImportedPresentation` (`references?: string[]`, `reveal?: SlideRevealStep[]` and `icon?: string` on both `Slide` and `SlideColumn`)
- `client/src/lib/themes.ts` — `Theme`, `THEMES` (the palette list), `ThemeId`
- `client/src/lib/icons.ts` — `ICON_MAP` (curated lucide allow-list), `IconName`, `getIcon()`
- `client/src/hooks/usePresentations.ts` — loads the deck list; also `createPresentation(title)` → `POST /api/presentations`
- `client/src/hooks/useSlides.ts` — loads parsed slides for a deck id, discarding stale responses
- `client/src/hooks/useTheme.ts` — `useTheme()` + `applyStoredTheme()` (localStorage key `slidedeck-theme`)
- `client/src/components/PresentationPicker.tsx` — deck chooser, "New presentation" modal, "Import JSON" file input
- `client/src/components/SlideDeck.tsx` — navigation, keyboard shortcuts, fullscreen, overview grid + search, help modal, references panel, JSON download
- `client/src/components/SlideView.tsx` — renders one slide, dispatching to the multi-column layout or single-column body; also draws the standalone decorative icon and the revealed `:::click` steps
- `client/src/components/InlineText.tsx` — renders inline markdown (bold, italic, code, links, tooltips, inline images, `:name:` icons)
- `client/src/components/ChartView.tsx` — hand-rolled SVG bar/line/pie charts with hover tooltips (pie has a legend)
- `client/src/components/Tooltip.tsx` — `TooltipBubble` popover + `InlineTooltip` term→hint component
- `client/src/components/ThemeSwitcher.tsx` — palette picker (used in both the picker and the deck header)
- `client/vite.config.ts` — plugins (Tailwind, React, React Compiler via Babel), `base: "./"`, `/api` proxy

## Slide markdown format

Slides are separated by `---`. All parsing lives in `server/markdown.js`; the regexes are the first 11 lines of that file and each rule below cites them.

| Syntax | Regex | Result |
| --- | --- | --- |
| `---` alone on a line | `/^---\s*$/m` | slide break |
| `~~~` alone on a line | `/^~~~\s*$/m` | column break |
| `:::click` / `:::` | `/^:::click\s*$/`, `/^:::\s*$/` | click-reveal block (see below) |
| `# Title` | `/^#\s+(.*)$/` | slide/column title, first one wins |
| `## Subtitle` | `/^##\s+(.*)$/` | appended to the subtitle |
| `> Citation` | `/^>\s*(.*)$/` | reference (see below) |
| `:name:` alone on a line | `/^:([a-z][a-z0-9]*(?:-[a-z0-9]+)*):$/` | decorative icon, first one wins |
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

### Icons (`:name:`)

`:rocket:` is a lucide icon. There are two positions, and they take very different paths through the code:

- **Inline** — `:zap:` inside a title, subtitle, item or reference renders at text size next to the words. The **server does nothing here**: the shortcode rides along verbatim inside the string and `InlineText` tokenises it. This is the same contract as `**bold**`, so it works everywhere `InlineText` does, with zero parser changes.
- **Standalone** — a line that is *only* `:name:` becomes a large decorative icon above the slide content, and the line is removed instead of being folded into the subtitle. This **does** need the server: `ICON_RE` in `markdown.js` pulls it out into `slide.icon`, which `SlideView` renders via `DecorativeIcon`. First one wins; `hasContent` counts it so an icon-only slide still parses.

Rules that matter:

- The name must start with a **letter** and be kebab-case. That is what keeps `Ratio:3:1` and `https://host/a:b` from being eaten — the regex requires `[a-z]` right after the first colon.
- Names are validated against `ICON_MAP` in `client/src/lib/icons.ts`, a **curated 132-icon allow-list**, not all ~2100 lucide icons. A name that is not in the map is left as **literal text** rather than dropped, so a typo degrades to `:no-such-icon:` instead of vanishing. The server accepts any well-formed `:name:`, so this list is the single source of truth.
- The allow-list exists for bundle reasons. `lucide-react/dynamic` would give all icons with zero code changes but drags a map of 2000+ dynamic-import thunks into the main chunk: measured **+34 kB gzip and 1832 files in `dist/`** versus **+13 kB gzip and 2 files** for the curated list. To add an icon, append it to both lists in `icons.ts` using the name from lucide.dev/icons.
- **In a layout file (`~~~`), icons belong to columns.** `parseSlide` runs per block, so each block's icon lands on that `SlideColumn`; the combined layout slide has no slide-level `icon`.
- Icons are plain strings on the wire, so they survive export/import unchanged; `App.tsx` validates `icon` as a string.


### Click reveals (`:::click`)

A `:::click` … `:::` block hides its content until it is revealed one step at a time, the "build it up" pattern: image 1 → click → image 2 → click → bullets.

```markdown
# Build one thing at a time

:::click
![first](images/one.svg)
A caption is a plain line in the same step

- step one
- step two

![chart:bar](inline:Build,Test,Ship;30,60,90)
:::
```

- **Blank lines separate steps; consecutive lines join one step.** So three bullet lines written together appear at once — insert a blank line between them for a progressive bullet list. A step with an image *and* a caption keeps them together.
- Each step line is classified by the same rules as a slide body: `![alt](src)` is an image (first one per step wins) or a chart when `alt` is `chart:<type>`, `- `/`1. ` lines are bullets, anything else is `text` — plain lines of a step are joined with single spaces, exactly like a subtitle, and render as a centred caption without a bullet. Inline `:icon:`, `**bold**` and links work inside `text` and `items`.
- The wire shape is `reveal?: { text?, items?, image?, charts? }[]` on both `Slide` and `SlideColumn`; steps render in that fixed order (image, charts, caption, bullets) regardless of the order they were written in. The server resolves media in steps exactly as it does for the slide body (`resolveReveal` in `index.js`), and `export.js` inlines step images as `data:` URIs, so a reveal deck stays portable.
- Reveal steps come out of `parseSlide`, so **a `:::click` block in a layout file (`~~~`) belongs to that column**, and `SlideView` advances every column in lockstep: `stepCount` is the longest column, and each column clamps to its own length.
- **`---` is not a step separator.** Slide splitting happens before the container is parsed, so in an ordinary slide file a `---` inside `:::click` ends the slide; in a layout file it falls through to the step's `text`. Never nest `~~~` inside a block either. A second `:::click` inside a block is ignored, and an unterminated block runs to the end of the slide.
- Empty steps are dropped, and `hasContent` counts `reveal`, so a reveal-only slide still parses.

On the client, `SlideDeck` owns the step counter and `SlideView` only renders `reveal.slice(0, revealStep)`:

- A click on the slide body, or `→`/`Space`/`Enter`, reveals the next step and only moves on once every step is shown; `←` rewinds a step before leaving the slide. `Home`/`End`, the overview grid and a slide change reset to step 0.
- **Clicking anywhere on a slide advances**, on every slide: a click on a `:::click` slide reveals the next step, and once every step is shown — or on a slide with no reveal block at all — the same click moves to the next slide, exactly like `→`. Clicks on links, buttons and form controls inside the slide body are the only exception, and the header/footer/overlays are siblings of the clickable area, so they never trigger it.
- `Esc` closes an overlay if one is open and otherwise rewinds to step 0; a chip above the footer shows `Reveal step 2 of 4`, then `All 4 steps revealed · Click for the next slide`. The chip is `pointer-events-none`, so it never becomes a dead spot, and the slide area shows `cursor-pointer` throughout.
- **A block of nothing but images overlays instead of stacking.** When every step in a `:::click` block is a lone image — no caption, bullets or chart anywhere — `SlideView` gives them one shared box: `RevealOverlay` places every image in the *same grid cell* (`gridArea: "1 / 1"`), so the box grows to the largest image and each one keeps its own aspect ratio instead of being letterboxed into a fixed frame. `z-index` equals the step number and each layer is nudged `8px × step` down and right, so the newest image covers the pile and the pile stays readable. One caption or bullet anywhere in the block switches the whole block back to vertical flow, so the layout cannot change shape as steps arrive. The wire format is the same either way; this is a pure client-side branch (`isImageOnlyReveal` in `SlideView.tsx`).
- Each newly revealed step mounts with the existing `animate-slide-in` class, so there is no separate animation system. In the overlay branch the wrapper animates once and later layers appear in place, which keeps a covering image from sliding in from the same offset every click.

### Inline markdown is rendered client-side

The server only rewrites inline **image** paths. `**bold**`, `*italic*`, `` `code` ``, `[text](url)`, `[text](tooltip:hint)` and `:icon:` are passed through verbatim and interpreted by `client/src/components/InlineText.tsx`. Adding a new inline construct therefore means editing that component, not the parser. `[text](tooltip:hint)` renders as an `InlineTooltip`; ordinary links open in a new tab. References go through the same `InlineText`, so citations support all of it.

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
- `importPresentation` deliberately keeps unknown extra properties rather than whitelisting fields, but `charts` contents are not validated — a malformed chart passes import and renders blank. `references` *is* checked as `string[]`, and `reveal` is checked as an array of steps with string `text`/`string[] items`/`image`/array `charts` (`isReveal` in `App.tsx`), because a bad step would throw during render.

## Conventions

- Styling is Tailwind utility classes; no standalone CSS modules.
- Colors are semantic tokens (`--color-bg`, `--color-accent`, `--color-panel`, …) generated from `@theme` in `client/src/index.css`, with per-palette overrides on `:root[data-theme='…']`. The palette list and selection live in `client/src/lib/themes.ts`, `client/src/hooks/useTheme.ts` (localStorage + `data-theme`), and `client/src/components/ThemeSwitcher.tsx` (picker + deck header). The five palettes are `midnight`, `dusk`, `forest`, `paper`, `daylight`. New palettes need both a `[data-theme]` block in `index.css` and an entry in `THEMES`.
- Icons come from `lucide-react`.
- Keyboard shortcuts are defined in one place, the `SHORTCUTS` table in `client/src/components/SlideDeck.tsx`, alongside the `window` keydown handler: `→`/`↓`/`PageDown`/`Space`/`Enter` next, `←`/`↑`/`PageUp` previous, `Home`/`End` first/last, `F` fullscreen, `O`/`G` overview, `R` references, `H`/`?` help, `Esc` close overlays (or rewind `:::click` steps when none is open). The next/previous keys step through `:::click` steps first and only change slide at the ends. The handler ignores events with modifier keys and all but `Escape` while focus is in a text field. `resetOverlays` closes the overview and the references panel together. When adding a shortcut, update `SHORTCUTS` too.
- React Compiler/Babel preset is enabled (`client/vite.config.ts`) — follow rules-of-hooks; oxlint enforces this.
- Server code is plain ESM JavaScript (`"type": "module"`), no build step.
- No test framework is configured.
