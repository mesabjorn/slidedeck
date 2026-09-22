import { useCallback, useEffect, useState } from 'react'
import type { PresentationMeta } from '../lib/types'

interface PresentationsState {
  presentations: PresentationMeta[]
  loading: boolean
  error: string | null
}

export function usePresentations() {
  const [state, setState] = useState<PresentationsState>({
    presentations: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const res = await fetch('/api/presentations')
        if (!res.ok) {
          throw new Error(`Failed to load presentations (${res.status})`)
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

  const createPresentation = useCallback(async (title: string): Promise<PresentationMeta> => {
    const res = await fetch('/api/presentations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) {
      throw new Error(`Failed to create presentation (${res.status})`)
    }
    const meta = (await res.json()) as PresentationMeta
    setState((current) => ({ ...current, presentations: [...current.presentations, meta] }))
    return meta
  }, [])

  return { ...state, createPresentation }
}