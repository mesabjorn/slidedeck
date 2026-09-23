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