import { useEffect, useState } from 'react'
import type { Slide } from '../lib/types'

interface SlidesState {
  slides: Slide[]
  loading: boolean
  error: string | null
}

interface DeckResult {
  id: string
  slides: Slide[]
  error: string | null
}

interface SlidesResponse {
  id: string
  slides: Slide[]
}

export function useSlides(presentationId: string | null): SlidesState {
  const [result, setResult] = useState<DeckResult | null>(null)

  useEffect(() => {
    if (!presentationId) return
    const id = presentationId

    let cancelled = false

    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/presentations/${id}/slides`)
        if (!res.ok) {
          throw new Error(`Failed to load ${id} (${res.status})`)
        }
        const data = (await res.json()) as SlidesResponse
        if (!cancelled) {
          setResult({ id, slides: data.slides, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setResult({
            id,
            slides: [],
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [presentationId])

  const loaded = result !== null && result.id === presentationId

  return {
    slides: loaded ? result.slides : [],
    loading: presentationId !== null && !loaded,
    error: loaded ? result.error : null,
  }
}