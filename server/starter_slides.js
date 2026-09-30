export const STARTER_SLIDES = {
  "01-welcome.md": `# Welcome

A brand-new SlideDeck presentation for you.

- :file-text: Every slide is a markdown file in slides/
- :list: The order lives in slides/index.json
- :keyboard: Press O for the overview, H for keyboard help, R for references
- :smile: A line holding only :rocket: becomes a big icon above the slide

> Author A, Author B (2024). Cited with a leading > sign.`,

  "02-structure.md": `# Deck structure

slides/index.json drives the whole deck.

- :layers: Sections carry a name and a slides array
- :file-text: Every slide is an object with a file field
- :eye: Objects with hidden:true are skipped server-side
- :quote: A line starting with > becomes a reference, shown behind the bookmark icon
- :play: A :::click block reveals its steps one click at a time
- :smile: Icons are :name: shortcodes, e.g. :zap:, listed in client/src/lib/icons.ts`,

  "03-getting-started.md": `# Getting started

Edit the files and refresh to see changes.

- Replace this slide with your own content
- Add charts from data/*.csv or inline data
- Run npm run dev to keep serving updates`,

  "04-layouts.md": `# Multi-col layouts

## left column
- this
- shows on the
- left

~~~

## right column
- goes
- on
- the
- right`,

  "05-columns.md": `# Column widths
## First column
- "~~~" splits a layout file into columns
- The layout array sets each column's flex width

~~~

## Second column
- "---" always starts a new slide
- Charts work in a column too
- An icon on its own line, like :lightbulb: below, belongs to that column

:database:

![chart:bar](inline:Q1,Q2,Q3;10,15,8)

~~~

## Third column
- Three blocks with [1,2,1] make the middle one wider
- Extra "~~~" blocks just fill remaining slots`,
  "06-click-reveal.md": `# Click reveals

A :::click block hides its steps until you click or press the right arrow.

:::click
- This bullet is the first step, and the right arrow or a click reveals it

A plain line like this is a caption, revealed as a step of its own

- These three bullets are one step
- because they are written without
- blank lines between them

![chart:bar](inline:Build,Test,Ship;30,60,90)
Images, captions and :rocket: icons reveal one step at a time too
:::`,
};

export const STARTER_INDEX = [
  {
    name: "Start",
    slides: [{ file: "01-welcome.md" }, { file: "02-structure.md" }],
  },
  { name: "Next steps", slides: [{ file: "03-getting-started.md" }] },
  {
    name: "Layouts",
    slides: [
      { file: "04-layouts.md", layout: [1, 1] },
      { file: "05-columns.md", layout: [1, 2, 1] },
    ],
  },
  { name: "Reveals", slides: [{ file: "06-click-reveal.md" }] },
];
