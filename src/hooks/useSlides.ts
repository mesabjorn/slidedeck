import { useEffect, useState } from 'react'
import { parseSlides } from '../lib/markdown'
import type { Slide } from '../lib/types'

interface SlidesState {
  slides: Slide[]
  loading: boolean
  error: string | null
}

export function useSlides(): SlidesState {
  const [state, setState] = useState<SlidesState>({
    slides: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const manifestRes = await fetch('slides/index.json')
        if (!manifestRes.ok) {
          throw new Error(`Failed to load slides/index.json (${manifestRes.status})`)
        }
        const files: string[] = await manifestRes.json()

        const slideLists = await Promise.all(
          files.map(async (file) => {
            const res = await fetch(`slides/${file}`)
            if (!res.ok) {
              throw new Error(`Failed to load slides/${file} (${res.status})`)
            }
            const text = await res.text()
            return parseSlides(text, file)
          }),
        )

        if (!cancelled) {
          setState({ slides: slideLists.flat(), loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            slides: [],
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