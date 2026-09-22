import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  HelpCircle,
  LayoutGrid,
  Presentation,
  Search,
  X,
} from 'lucide-react'
import type { Slide } from '../lib/types'
import { InlineText } from './InlineText'
import { SlideView } from './SlideView'
import { ThemeSwitcher } from './ThemeSwitcher'

interface SlideDeckProps {
  slides: Slide[]
  presentationTitle?: string
  onExit?: () => void
}

const SHORTCUTS = [
  { keys: '→ / Space', action: 'Next slide' },
  { keys: '←', action: 'Previous slide' },
  { keys: 'Home', action: 'First slide' },
  { keys: 'End', action: 'Last slide' },
  { keys: 'F', action: 'Toggle fullscreen' },
  { keys: 'O', action: 'Toggle overview' },
  { keys: 'H', action: 'Show this help' },
  { keys: 'Esc', action: 'Close overlays' },
]

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border/15 bg-surface/10 px-2 py-1 font-mono text-xs text-ink">
      {children}
    </kbd>
  )
}

export function SlideDeck({ slides, presentationTitle, onExit }: SlideDeckProps) {
  const total = slides.length
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [query, setQuery] = useState('')

  const goTo = useCallback((target: number) => {
    setIndex(Math.min(Math.max(target, 0), total - 1))
  }, [total])

  const next = useCallback(() => {
    setIndex((current) => Math.min(current + 1, total - 1))
  }, [total])

  const prev = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Fullscreen API unavailable
    }
  }, [])

  const resetOverview = useCallback(() => {
    setShowOverview(false)
    setQuery('')
  }, [])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable

      if (isTyping) {
        if (event.key === 'Escape') resetOverview()
        return
      }

      if (showHelp) {
        if (event.key === 'Escape' || event.key === 'h' || event.key === 'H' || event.key === '?') {
          setShowHelp(false)
        }
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
        case 'Enter':
          event.preventDefault()
          resetOverview()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault()
          resetOverview()
          prev()
          break
        case 'Home':
          event.preventDefault()
          resetOverview()
          goTo(0)
          break
        case 'End':
          event.preventDefault()
          resetOverview()
          goTo(total - 1)
          break
        case 'f':
        case 'F':
          void toggleFullscreen()
          break
        case 'o':
        case 'O':
        case 'g':
        case 'G':
          setQuery('')
          setShowOverview((current) => !current)
          break
        case 'h':
        case 'H':
        case '?':
          setShowHelp(true)
          break
        case 'Escape':
          if (document.fullscreenElement) {
            void document.exitFullscreen()
          } else {
            resetOverview()
          }
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo, next, prev, resetOverview, showHelp, toggleFullscreen, total])

  const current = slides[index] ?? slides[0]
  const progress = total > 1 ? (index / (total - 1)) * 100 : 100

  const normalizedQuery = query.trim().toLowerCase()
  const matching = slides
    .map((slide, i) => ({ slide, i }))
    .filter(({ slide }) => {
      if (normalizedQuery.length === 0) return true
      return (
        slide.title.toLowerCase().includes(normalizedQuery) ||
        slide.subtitle?.toLowerCase().includes(normalizedQuery) ||
        slide.items.some((item) => item.toLowerCase().includes(normalizedQuery))
      )
    })

  const grouped = matching.reduce<{ name?: string; cards: typeof matching }[]>(
    (acc, match) => {
      const name = match.slide.section
      const last = acc[acc.length - 1]
      if (last && last.name === name) {
        last.cards.push(match)
      } else {
        acc.push({ name, cards: [match] })
      }
      return acc
    },
    [],
  )

  const overviewCard = ({ slide, i }: { slide: Slide; i: number }) => (
    <button
      type="button"
      key={slide.id}
      onClick={() => {
        goTo(i)
        resetOverview()
      }}
      className={`rounded-xl border p-5 text-left transition ${
        i === index
          ? 'border-accent bg-accent/10'
          : 'border-border/10 bg-surface/5 hover:border-border/30 hover:bg-surface/10'
      }`}
    >
      <span className="font-mono text-xs text-faint">
        {String(i + 1).padStart(2, '0')}
      </span>
      <span className="mt-2 block text-base leading-snug font-medium text-heading">
        <InlineText text={slide.title} />
      </span>
      {slide.subtitle && (
        <span className="mt-1 block text-sm text-muted">
          <InlineText text={slide.subtitle} />
        </span>
      )}
    </button>
  )

  return (
    <div className="relative h-full overflow-hidden bg-bg text-ink">
      <div
        key={current.id}
        className="animate-slide-in absolute inset-0 flex items-center justify-center p-12 sm:p-16"
      >
        <SlideView slide={current} />
      </div>

      <header className={`absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-5 py-4 ${
        isFullscreen ? 'justify-center' : ''
      }`}>
        {!isFullscreen && (
          <div className="flex gap-2">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                title="All presentations"
                className="rounded-full bg-surface/10 p-2.5 text-muted transition hover:bg-surface/20 hover:text-heading"
              >
                <Presentation className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="Help (H)"
              className="rounded-full bg-surface/10 p-2.5 text-muted transition hover:bg-surface/20 hover:text-heading"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        <span
          className={`font-mono text-sm ${
            isFullscreen
              ? 'text-faint/70'
              : 'rounded-full bg-surface/10 px-3 py-1 text-ink'
          }`}
        >
          {index + 1} / {total}
        </span>

        {!isFullscreen && (
          <div className="ml-auto flex gap-2">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setShowOverview((current) => !current)
              }}
              title="Overview (O)"
              className="rounded-full bg-surface/10 p-2.5 text-muted transition hover:bg-surface/20 hover:text-heading"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              title="Fullscreen (F)"
              className="rounded-full bg-surface/10 p-2.5 text-muted transition hover:bg-surface/20 hover:text-heading"
            >
              <Expand className="h-5 w-5" />
            </button>
          </div>
        )}
      </header>

      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-4 px-5 py-4">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          title="Previous (←)"
          className="rounded-full bg-surface/10 p-2.5 text-ink transition hover:bg-surface/20 hover:text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface/10">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={next}
          disabled={index === total - 1}
          title="Next (→)"
          className="rounded-full bg-surface/10 p-2.5 text-ink transition hover:bg-surface/20 hover:text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>

      {index === 0 && !showHelp && !showOverview && (
        <div className="animate-slide-in absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-surface/10 px-4 py-2 text-sm text-ink">
          Press <Kbd>→</Kbd> to start
          <span className="text-faint">·</span>
          <Kbd>H</Kbd> for shortcuts
        </div>
      )}

      {showOverview && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-overlay/90 p-8 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-xl font-semibold text-heading">
                {presentationTitle ?? 'Overview'}
              </h2>
              <span className="text-sm text-faint">
                {normalizedQuery.length > 0
                  ? `${matching.length} / ${total} slides`
                  : `${total} slides`}
              </span>
            </div>

            <div className="relative mb-6">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search slides…"
                aria-label="Search slides"
                autoFocus
                className="w-full max-w-md rounded-full border border-border/10 bg-surface/5 py-2 pr-4 pl-9 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent/60 focus:bg-surface/10"
              />
            </div>

            {matching.length === 0 ? (
              <div className="rounded-xl border border-border/10 bg-surface/5 p-10 text-center text-sm text-muted">
                No slides match “{query.trim()}”.
              </div>
            ) : normalizedQuery.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matching.map(overviewCard)}
              </div>
            ) : (
              <div className="space-y-10">
                {grouped.map((group, groupIndex) => (
                  <section key={groupIndex}>
                    {group.name && (
                      <h3 className="mb-4 font-mono text-xs tracking-[0.3em] text-faint uppercase">
                        {group.name}
                      </h3>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.cards.map(overviewCard)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-overlay/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/10 bg-panel p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-heading">Keyboard shortcuts</h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-muted transition hover:text-heading"
                aria-label="Close help"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between gap-4">
                  <dt className="text-muted">{shortcut.action}</dt>
                  <dd>
                    <Kbd>{shortcut.keys}</Kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}