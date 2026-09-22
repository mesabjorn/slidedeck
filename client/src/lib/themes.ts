export interface Theme {
  id: string
  name: string
  bg: string
  accent: string
}

export const THEMES: Theme[] = [
  { id: 'midnight', name: 'Midnight', bg: '#0b0f1a', accent: '#818cf8' },
  { id: 'dusk', name: 'Dusk', bg: '#150d2b', accent: '#a78bfa' },
  { id: 'forest', name: 'Forest', bg: '#0a1622', accent: '#34d399' },
  { id: 'paper', name: 'Paper', bg: '#faf7f2', accent: '#b45309' },
  { id: 'daylight', name: 'Daylight', bg: '#f8fafc', accent: '#6366f1' },
]

export type ThemeId = (typeof THEMES)[number]['id']