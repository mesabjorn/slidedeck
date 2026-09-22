export const STARTER_SLIDES = {
  "01-welcome.md": `# Welcome

A brand-new SlideDeck presentation for you.

- Every slide is a markdown file in slides/
- The order lives in slides/index.json
- Press O for the overview, H for keyboard help`,

  "02-structure.md": `# Deck structure

slides/index.json drives the whole deck.

- Sections carry a name and a slides array
- Objects with hidden:true are skipped server-side
- Flat filename arrays still work as a shortcut`,

  "03-getting-started.md": `# Getting started

Edit the files and refresh to see changes.

- Replace this slide with your own content
- Add charts from data/*.csv or inline data
- Run npm run dev to keep serving updates`,

  "04-layouts.md": `# left column
- this
- shows on the
- left

~~~

# right column
- goes
- on
- the
- right`,

  "05-columns.md": `# First column
- "~~~" splits a layout file into columns
- The layout array sets each column's flex width

~~~

# Second column
- "---" always starts a new slide
- Charts work in a column too

![chart:bar](inline:Q1,Q2,Q3;10,15,8)

~~~

# Third column
- Three blocks with [1,1,1] make three equal columns
- Extra "~~~" blocks just fill remaining slots`,
};

export const STARTER_INDEX = [
  { name: "Start", slides: ["01-welcome.md", "02-structure.md"] },
  { name: "Next steps", slides: ["03-getting-started.md"] },
  { name: "Layouts", slides: [{ file: "04-layouts.md", layout: [1, 1] }, { file: "05-columns.md", layout: [1, 1, 1] }] },
];
