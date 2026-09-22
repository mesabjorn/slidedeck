import { useEffect, useState } from 'react'
import { THEMES, type ThemeId } from '../lib/themes'

const THEME_STORAGE_KEY = 'slidedeck-theme'

export function useTheme(): { themeId: ThemeId; setThemeId: (id: ThemeId) => void } {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.some((theme) => theme.id === saved) ? (saved as ThemeId) : THEMES[0].id
  })

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }, [themeId])

  return { themeId, setThemeId }
}

export function applyStoredTheme(): void {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (THEMES.some((theme) => theme.id === saved)) {
    document.documentElement.dataset.theme = saved as ThemeId
  }
}