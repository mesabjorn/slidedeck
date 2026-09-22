# Deck structure

slides/index.json drives the whole deck.

- Sections carry a name and a slides array
- Objects with hidden:true are skipped server-side
- Flat filename arrays still work as a shortcut