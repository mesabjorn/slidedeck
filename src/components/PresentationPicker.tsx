import { ArrowRight, FileWarning, Layers, Loader2, Presentation } from 'lucide-react'
import type { PresentationMeta } from '../lib/types'
import { ThemeSwitcher } from './ThemeSwitcher'

interface PresentationPickerProps {
  presentations: PresentationMeta[]
  loading: boolean
  error: string | null
  onSelect: (id: string) => void
}

export function PresentationPicker({
  presentations,
  loading,
  error,
  onSelect,
}: PresentationPickerProps) {
  if (loading) {
    return (
      <main className="grid h-full place-items-center bg-bg">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm">Loading presentations…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid h-full place-items-center bg-bg px-6">
        <div className="flex max-w-lg flex-col items-center gap-4 text-center">
          <FileWarning className="h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-semibold text-heading">Could not load presentations</h1>
          <p className="text-sm text-muted">{error}</p>
          <p className="text-xs text-faint">
            Make sure the backend is running and{' '}
            <code className="rounded bg-surface/10 px-1 py-0.5 font-mono">server/content/presentations.json</code>{' '}
            exists and points at valid presentation folders.
          </p>
        </div>
      </main>
    )
  }

  if (presentations.length === 0) {
    return (
      <main className="grid h-full place-items-center bg-bg px-6">
        <div className="flex max-w-lg flex-col items-center gap-4 text-center">
          <Layers className="h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-semibold text-heading">No presentations found</h1>
          <p className="text-sm text-muted">
            Add a folder like{' '}
            <code className="rounded bg-surface/10 px-1 py-0.5 font-mono">server/content/presentation1</code>{' '}
            and list it in{' '}
            <code className="rounded bg-surface/10 px-1 py-0.5 font-mono">server/content/presentations.json</code>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-full overflow-y-auto bg-bg px-6 py-16">
      <div className="absolute top-6 right-6">
        <ThemeSwitcher />
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-10 text-center">
          <Presentation className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-4xl font-bold text-heading">SlideDeck</h1>
          <p className="mt-2 text-muted">Choose a presentation to start</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {presentations.map((presentation) => (
            <button
              key={presentation.id}
              type="button"
              onClick={() => onSelect(presentation.id)}
              className="group flex flex-col rounded-2xl border border-border/10 bg-surface/5 p-6 text-left transition hover:border-accent/60 hover:bg-surface/10"
            >
              <div className="flex items-center justify-between text-accent-strong">
                <Presentation className="h-6 w-6" />
                {presentation.slideCount !== undefined && (
                  <span className="rounded-full bg-surface/10 px-2.5 py-0.5 font-mono text-xs text-ink">
                    {presentation.slideCount} slides
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-semibold text-heading">{presentation.title}</h2>
              {presentation.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {presentation.description}
                </p>
              )}

              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition group-hover:text-accent-strong">
                Open
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}