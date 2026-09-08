import { useEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { THEMES } from '../lib/themes'
import { useTheme } from '../hooks/useTheme'

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        title="Theme"
        aria-label="Switch theme"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="rounded-full bg-surface/10 p-2.5 text-muted transition hover:bg-surface/20 hover:text-heading"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Themes"
          className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-border/15 bg-panel p-1 shadow-2xl"
        >
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              role="option"
              aria-selected={theme.id === themeId}
              onClick={() => {
                setThemeId(theme.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink transition hover:bg-surface/10"
            >
              <span
                className="flex h-6 w-9 shrink-0 items-center justify-center rounded-md border border-border/15"
                style={{ backgroundColor: theme.bg }}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.accent }} />
              </span>
              <span className="flex-1">{theme.name}</span>
              {theme.id === themeId && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}