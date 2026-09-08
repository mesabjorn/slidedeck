import { useEffect, useState } from 'react'
import { parseSlides, resolveMediaInText, resolveMediaPath } from '../lib/markdown'
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

export function useSlides(presentationId: string | null): SlidesState {
  const [result, setResult] = useState<DeckResult | null>(null)

  useEffect(() => {
    if (!presentationId) return
    const id = presentationId

    let cancelled = false

    async function load(): Promise<void> {
      try {
        const resolve = (src: string) => resolveMediaPath(src, id)

        const manifestRes = await fetch(`${id}/slides/index.json`)
        if (!manifestRes.ok) {
          throw new Error(`Failed to load ${id}/slides/index.json (${manifestRes.status})`)
        }
        const files: string[] = await manifestRes.json()

        const parsed = await Promise.all(
          files.map(async (file) => {
            const res = await fetch(`${id}/slides/${file}`)
            if (!res.ok) {
              throw new Error(`Failed to load ${id}/slides/${file} (${res.status})`)
            }
            const text = await res.text()
            return parseSlides(text, file).map((slide) => ({
              ...slide,
              title: resolveMediaInText(slide.title, resolve),
              subtitle: slide.subtitle ? resolveMediaInText(slide.subtitle, resolve) : undefined,
              items: slide.items.map((item) => resolveMediaInText(item, resolve)),
              image: slide.image ? { ...slide.image, src: resolve(slide.image.src) } : undefined,
            }))
          }),
        )

        if (!cancelled) {
          setResult({ id, slides: parsed.flat(), error: null })
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