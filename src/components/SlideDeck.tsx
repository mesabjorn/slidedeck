import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  HelpCircle,
  LayoutGrid,
  Shrink,
  X,
} from 'lucide-react'
import type { Slide } from '../lib/types'
import { InlineText } from './InlineText'
import { SlideView } from './SlideView'

interface SlideDeckProps {
  slides: Slide[]
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
    <kbd className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-xs text-slate-200">
      {children}
    </kbd>
  )
}

export function SlideDeck({ slides }: SlideDeckProps) {
  const total = slides.length
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

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
          setShowOverview(false)
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault()
          setShowOverview(false)
          prev()
          break
        case 'Home':
          event.preventDefault()
          setShowOverview(false)
          goTo(0)
          break
        case 'End':
          event.preventDefault()
          setShowOverview(false)
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
            setShowOverview(false)
          }
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo, next, prev, showHelp, toggleFullscreen, total])

  const current = slides[index] ?? slides[0]
  const progress = total > 1 ? (index / (total - 1)) * 100 : 100

  return (
    <div className="relative h-full overflow-hidden bg-[#0b0f1a] text-slate-200">
      <div
        key={current.id}
        className="animate-slide-in absolute inset-0 flex items-center justify-center p-12 sm:p-16"
      >
        <SlideView slide={current} />
      </div>

      <header className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          title="Help (H)"
          className="rounded-full bg-white/10 p-2.5 text-slate-400 transition hover:bg-white/20 hover:text-white"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm text-slate-300">
          {index + 1} / {total}
        </span>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setShowOverview((current) => !current)}
            title="Overview (O)"
            className="rounded-full bg-white/10 p-2.5 text-slate-400 transition hover:bg-white/20 hover:text-white"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title="Fullscreen (F)"
            className="rounded-full bg-white/10 p-2.5 text-slate-400 transition hover:bg-white/20 hover:text-white"
          >
            {isFullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-4 px-5 py-4">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          title="Previous (←)"
          className="rounded-full bg-white/10 p-2.5 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-indigo-400 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={next}
          disabled={index === total - 1}
          title="Next (→)"
          className="rounded-full bg-white/10 p-2.5 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>

      {index === 0 && !showHelp && !showOverview && (
        <div className="animate-slide-in absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">
          Press <Kbd>→</Kbd> to start
          <span className="text-slate-500">·</span>
          <Kbd>H</Kbd> for shortcuts
        </div>
      )}

      {showOverview && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-black/90 p-8 backdrop-blur-sm">
          <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((slide, i) => (
              <button
                type="button"
                key={slide.id}
                onClick={() => {
                  goTo(i)
                  setShowOverview(false)
                }}
                className={`rounded-xl border p-5 text-left transition ${
                  i === index
                    ? 'border-indigo-400 bg-indigo-400/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <span className="font-mono text-xs text-slate-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mt-2 block text-base leading-snug font-medium text-white">
                  <InlineText text={slide.title} />
                </span>
                {slide.subtitle && (
                  <span className="mt-1 block text-sm text-slate-400">
                    <InlineText text={slide.subtitle} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-white">Keyboard shortcuts</h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-slate-400 transition hover:text-white"
                aria-label="Close help"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">{shortcut.action}</dt>
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