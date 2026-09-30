# Slidedeck

# Usage:

Install backend dependencies:   
```bash
npm install
cd client
npm install;
```

Run from root:  
`npm run dev`  //runs both server and client concurrently

Open app on localhost:5173

## Deck anatomy: `slides/index.json`

Every deck under `server/content/<id>/` has a `slides/index.json` that defines the order and composition of the presentation. It is always an array of sections; each section has a `name` shown as a header in the overview grid, and a `slides` array. Every slide must be an object:

```json
[
  {
    "name": "Start",
    "slides": [
      { "file": "01-intro.md" },
      { "file": "02-features.md" }
    ]
  },
  {
    "name": "Charts",
    "slides": [
      { "file": "05-charts.md" },
      { "file": "05-charts-line.md", "hidden": true },
      { "file": "05-charts-pie.md" }
    ]
  },
  {
    "name": "Wrap up",
    "slides": [{ "file": "04-outro.md" }],
    "hidden": true //allow section to be hidden
  }
]
```

### Entry forms

A slide object supports:

- `"file"` (required) — the markdown filename, e.g. `"01-intro.md"`
- `"hidden": true` — hidden slides are excluded server-side and never reach the client
- `"layout": [1, 1]` — optional column flex weights; columns are otherwise inferred from the number of `~~~` separators in the file, defaulting to an equal split (one `~~~` → `[1, 1]`, two → `[1, 1, 1]`)

A section object may also carry `"hidden": true` to exclude the entire section:

```json
{ "name": "Notes", "hidden": true, "slides": [{ "file": "appendix.md" }] }
```

`hidden: true` anywhere means the slide or section is omitted from the API response, the slide counter, and the overview. It never reaches the frontend.

## Slide markdown: building a slide up on clicks

Wrap a block in `:::click` … `:::` to hide it until the audience clicks through it. Consecutive lines form one step; a blank line starts the next one. Images, charts, bullets and captions are all allowed as steps:

```markdown
# Build one thing at a time

:::click
![first](images/one.svg)
A caption is a plain line in the same step

- step one
- step two

![second](images/two.svg)
:::
```

The first click shows the first image and its caption, the second adds the two bullets, the third adds the second image; the next click (or the next `→`) moves on to the next slide. `←` steps back, `Esc` rewinds the slide to its first step. A `:::click` block inside a multi-column file (`~~~`) belongs to that column.

Clicking anywhere on a slide advances it — the next reveal step if one is left, otherwise the next slide — on every slide, with or without a `:::click` block. `→`, `Space` and the chevron buttons do the same.

If **every** step in a block is a lone image, the images are revealed on top of each other instead of stacked — each new one covers the previous and nudges down-right by 8px, so the pile stays visible. Add a caption or a bullet to a block and it goes back to stacking downwards.

`AGENTS.md` documents every markdown block construct, including charts, `> ` references, `:icon:` shortcodes and `:::click`.
