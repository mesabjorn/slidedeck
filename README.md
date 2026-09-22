# Slidedeck

# Usage:

`npm install`  
`npm run dev`  

Open app on localhost:5173

## Deck anatomy: `slides/index.json`

Every deck under `server/content/<id>/` has a `slides/index.json` that defines the order and composition of the presentation. It supports two shapes, both fielded by the server.

### Simple list

A flat array of slide filenames:

```json
["01-intro.md", "02-features.md", "03-usage.md"]
```

### Sections

An array of sections; each section has a `name` shown as a header in the overview grid, and a `slides` array:

```json
[
  {
    "name": "Start",
    "slides": ["01-intro.md", "02-features.md"]
  },
  {
    "name": "Navigation",
    "slides": ["03-usage.md"]
  },
  {
    "name": "Charts",
    "slides": [
      "05-charts.md",
      { "file": "05-charts-line.md", "hidden": true },
      "05-charts-pie.md"
    ]
  },
  {
    "name": "Wrap up",
    "slides": ["04-outro.md"], 
    "hidden":true //allow section to be hidden
  }
]
```

### Entry forms

A slide entry may be:

- a plain filename string — `"01-intro.md"`
- an object `{ "file": "01-intro.md", "hidden": true }` — hidden slides are excluded server-side and never reach the client

A section object may also carry `"hidden": true` to exclude the entire section:

```json
{ "name": "Notes", "hidden": true, "slides": ["appendix.md"] }
```

`hidden: true` anywhere means the slide or section is omitted from the API response, the slide counter, and the overview. It never reaches the frontend.