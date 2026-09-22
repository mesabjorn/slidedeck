import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, FileWarning, Layers, Loader2, Plus, Presentation, X } from 'lucide-react'
import type { PresentationMeta } from '../lib/types'
import { ThemeSwitcher } from './ThemeSwitcher'

interface PresentationPickerProps {
  presentations: PresentationMeta[]
  loading: boolean
  error: string | null
  onSelect: (id: string) => void
  onCreate: (title: string) => Promise<PresentationMeta>
}

export function PresentationPicker({
  presentations,
  loading,
  error,
  onSelect,
  onCreate,
}: PresentationPickerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreate(event: FormEvent): Promise<void> {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const meta = await onCreate(title)
      setShowCreate(false)
      setNewTitle('')
      onSelect(meta.id)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create presentation')
      setCreating(false)
    }
  }

  function closeCreate(): void {
    if (creating) return
    setShowCreate(false)
    setNewTitle('')
    setCreateError(null)
  }

  const createModal = (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-overlay/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/10 bg-panel p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-heading">New presentation</h2>
              <button
                type="button"
                onClick={closeCreate}
                className="text-muted transition hover:text-heading"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              Creates a folder with starter slides and a sections index.json under
              server/content/.
            </p>
            <form onSubmit={(event) => void handleCreate(event)} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted">Title</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="My new deck"
                  autoFocus
                  className="w-full rounded-lg border border-border/10 bg-surface/10 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent/60"
                />
              </label>
              {createError && <p className="text-sm text-amber-400">{createError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={creating}
                  className="rounded-full px-4 py-2 text-sm text-muted transition hover:text-ink disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || newTitle.trim().length === 0}
                  className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )

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
            Create one to get started, or add a folder like{' '}
            <code className="rounded bg-surface/10 px-1 py-0.5 font-mono">server/content/presentation1</code>{' '}
            and list it in{' '}
            <code className="rounded bg-surface/10 px-1 py-0.5 font-mono">server/content/presentations.json</code>.
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-2 flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create your first presentation
          </button>
        </div>
        {createModal}
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

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/30 p-6 text-muted transition hover:border-accent/60 hover:text-accent"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">New presentation</span>
          </button>
        </div>
      </div>
      {createModal}
    </main>
  )
}