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
};
