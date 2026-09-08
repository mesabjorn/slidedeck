import { useEffect, useState } from 'react'
import type { PresentationMeta } from '../lib/types'

interface PresentationsState {
  presentations: PresentationMeta[]
  loading: boolean
  error: string | null
}

export function usePresentations(): PresentationsState {
  const [state, setState] = useState<PresentationsState>({
    presentations: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const res = await fetch('presentations.json')
        if (!res.ok) {
          throw new Error(`Failed to load presentations.json (${res.status})`)
        }
        const presentations = (await res.json()) as PresentationMeta[]
        if (!cancelled) {
          setState({ presentations, loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            presentations: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}