import { FileWarning, Loader2 } from 'lucide-react'
import { SlideDeck } from './components/SlideDeck'
import { useSlides } from './hooks/useSlides'

function App() {
  const { slides, loading, error } = useSlides()

  if (loading) {
    return (
      <main className="grid h-full place-items-center bg-[#0b0f1a]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm">Loading slides…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid h-full place-items-center bg-[#0b0f1a] px-6">
        <div className="flex max-w-lg flex-col items-center gap-4 text-center">
          <FileWarning className="h-10 w-10 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">Could not load slides</h1>
          <p className="text-sm text-slate-400">{error}</p>
          <p className="text-xs text-slate-500">
            Check that <code className="rounded bg-white/10 px-1 py-0.5 font-mono">public/slides</code>{' '}
            exists and <code className="rounded bg-white/10 px-1 py-0.5 font-mono">index.json</code>{' '}
            lists valid markdown files.
          </p>
        </div>
      </main>
    )
  }

  if (slides.length === 0) {
    return (
      <main className="grid h-full place-items-center bg-[#0b0f1a] text-sm text-slate-400">
        No slides found. Add markdown files to public/slides/.
      </main>
    )
  }

  return <SlideDeck slides={slides} />
}

export default App