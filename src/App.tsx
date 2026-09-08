import { useState } from 'react'
import { FileWarning, Loader2 } from 'lucide-react'
import { PresentationPicker } from './components/PresentationPicker'
import { SlideDeck } from './components/SlideDeck'
import { usePresentations } from './hooks/usePresentations'
import { useSlides } from './hooks/useSlides'

function App() {
  const { presentations, loading: loadingPresentations, error: presentationsError } =
    usePresentations()
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const { slides, loading, error } = useSlides(presentationId)

  if (!presentationId) {
    return (
      <PresentationPicker
        presentations={presentations}
        loading={loadingPresentations}
        error={presentationsError}
        onSelect={setPresentationId}
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
            onClick={() => setPresentationId(null)}
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
      presentationTitle={meta?.title}
      onExit={() => setPresentationId(null)}
    />
  )
}

export default App