import { useEffect, useState } from 'react'
import { ArrowRight, FileWarning, Layers, Loader2, Presentation } from 'lucide-react'
import type { PresentationMeta } from '../lib/types'

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
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false

    async function fetchCounts(): Promise<void> {
      const entries = await Promise.all(
        presentations.map(async (presentation) => {
          try {
            const res = await fetch(`${presentation.id}/slides/index.json`)
            if (!res.ok) return { id: presentation.id, count: 0 }
            const files: unknown = await res.json()
            return { id: presentation.id, count: Array.isArray(files) ? files.length : 0 }
          } catch {
            return { id: presentation.id, count: 0 }
          }
        }),
      )
      if (!cancelled) {
        setCounts(Object.fromEntries(entries.map((entry) => [entry.id, entry.count])))
      }
    }

    if (presentations.length > 0) void fetchCounts()
    return () => {
      cancelled = true
    }
  }, [presentations])

  if (loading) {
    return (
      <main className="grid h-full place-items-center bg-[#0b0f1a]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm">Loading presentations…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid h-full place-items-center bg-[#0b0f1a] px-6">
        <div className="flex max-w-lg flex-col items-center gap-4 text-center">
          <FileWarning className="h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">Could not load presentations</h1>
          <p className="text-sm text-slate-400">{error}</p>
          <p className="text-xs text-slate-500">
            Check that <code className="rounded bg-white/10 px-1 py-0.5 font-mono">public/presentations.json</code>{' '}
            exists and points at valid presentation folders.
          </p>
        </div>
      </main>
    )
  }

  if (presentations.length === 0) {
    return (
      <main className="grid h-full place-items-center bg-[#0b0f1a] px-6">
        <div className="flex max-w-lg flex-col items-center gap-4 text-center">
          <Layers className="h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">No presentations found</h1>
          <p className="text-sm text-slate-400">
            Add a folder like{' '}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono">public/presentation1</code>{' '}
            and list it in{' '}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono">public/presentations.json</code>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-full overflow-y-auto bg-[#0b0f1a] px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-10 text-center">
          <Presentation className="mx-auto h-10 w-10 text-indigo-400" />
          <h1 className="mt-4 text-4xl font-bold text-white">SlideDeck</h1>
          <p className="mt-2 text-slate-400">Choose a presentation to start</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {presentations.map((presentation) => (
            <button
              key={presentation.id}
              type="button"
              onClick={() => onSelect(presentation.id)}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition hover:border-indigo-400/60 hover:bg-white/10"
            >
              <div className="flex items-center justify-between text-indigo-300">
                <Presentation className="h-6 w-6" />
                {presentation.id in counts && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                    {counts[presentation.id]} slides
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-semibold text-white">{presentation.title}</h2>
              {presentation.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {presentation.description}
                </p>
              )}

              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition group-hover:text-indigo-200">
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