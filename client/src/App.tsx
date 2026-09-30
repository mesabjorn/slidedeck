import { useState } from 'react'
import { FileWarning, Loader2 } from 'lucide-react'
import { PresentationPicker } from './components/PresentationPicker'
import { SlideDeck } from './components/SlideDeck'
import { usePresentations } from './hooks/usePresentations'
import { useSlides } from './hooks/useSlides'
import type { ImportedPresentation, Slide } from './lib/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSlide(value: unknown): value is Slide {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.items) ||
    !value.items.every((item) => typeof item === 'string')
  ) {
    return false
  }
  if (value.subtitle !== undefined && typeof value.subtitle !== 'string') return false
  if (value.section !== undefined && typeof value.section !== 'string') return false
  if (
    value.image !== undefined &&
    (!isRecord(value.image) ||
      typeof value.image.src !== 'string' ||
      typeof value.image.alt !== 'string')
  ) {
    return false
  }
  if (value.charts !== undefined && !Array.isArray(value.charts)) return false
  if (
    value.columns !== undefined &&
    (!Array.isArray(value.columns) ||
      !value.columns.every(
        (column) =>
          isRecord(column) &&
          typeof column.title === 'string' &&
          Array.isArray(column.items) &&
          column.items.every((item) => typeof item === 'string') &&
          typeof column.flex === 'number',
      ))
  ) {
    return false
  }
  return true
}

async function importPresentation(file: File): Promise<ImportedPresentation> {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Could not read the selected JSON file')
  }

  if (!isRecord(data) || !Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error('JSON must contain a non-empty slides array')
  }
  if (!data.slides.every(isSlide)) {
    throw new Error('JSON contains an invalid slide')
  }

  const slides = data.slides as Slide[]
  const id =
    (typeof data.id === 'string' && data.id.trim()) ||
    file.name.replace(/\.json$/i, '').trim() ||
    'imported-presentation'
  const title =
    (typeof data.title === 'string' && data.title.trim()) ||
    slides[0].title.trim() ||
    'Imported presentation'

  return { id, title, slides }
}

function downloadImportedPresentation(presentation: ImportedPresentation): void {
  const blob = new Blob(
    [JSON.stringify({ id: presentation.id, slides: presentation.slides }, null, 2)],
    { type: 'application/json' },
  )
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `${presentation.id.replace(/[^a-z0-9._-]+/gi, '-') || 'imported'}-slides.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function App() {
  const { presentations, loading: loadingPresentations, error: presentationsError, createPresentation } =
    usePresentations()
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const [importedPresentation, setImportedPresentation] = useState<ImportedPresentation | null>(null)
  const { slides: loadedSlides, loading, error } = useSlides(
    importedPresentation ? null : presentationId,
  )
  const slides = importedPresentation?.slides ?? loadedSlides

  if (!presentationId && !importedPresentation) {
    return (
      <PresentationPicker
        presentations={presentations}
        loading={loadingPresentations}
        error={presentationsError}
        onSelect={(id) => {
          setImportedPresentation(null)
          setPresentationId(id)
        }}
        onCreate={createPresentation}
        onImport={async (file) => {
          const imported = await importPresentation(file)
          setImportedPresentation(imported)
          setPresentationId(null)
        }}
      />
    )
  }

  if (loading) {
    return (
      <main className="grid h-full place-items-center bg-bg">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm">Loading presentation…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid h-full place-items-center bg-bg px-6">
        <div className="flex max-w-lg flex-col items-center gap-4 text-center">
          <FileWarning className="h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-semibold text-heading">Could not load presentation</h1>
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => {
              setPresentationId(null)
              setImportedPresentation(null)
            }}
            className="rounded-full bg-surface/10 px-4 py-2 text-sm text-ink transition hover:bg-surface/20"
          >
            Back to presentations
          </button>
        </div>
      </main>
    )
  }

  if (slides.length === 0) {
    return (
      <main className="grid h-full place-items-center bg-bg text-sm text-muted">
        No slides found in this presentation.
      </main>
    )
  }

  const meta = presentations.find((presentation) => presentation.id === presentationId)

  return (
    <SlideDeck
      slides={slides}
      presentationId={importedPresentation ? undefined : presentationId ?? undefined}
      presentationTitle={importedPresentation?.title ?? meta?.title}
      onDownload={
        importedPresentation
          ? () => downloadImportedPresentation(importedPresentation)
          : undefined
      }
      onExit={() => {
        setPresentationId(null)
        setImportedPresentation(null)
      }}
    />
  )
}

export default App
