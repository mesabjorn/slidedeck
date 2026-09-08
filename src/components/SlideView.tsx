import type { Slide } from '../lib/types'
import { InlineText } from './InlineText'

export function SlideView({ slide }: { slide: Slide }) {
  return (
    <div className="w-full max-w-4xl text-center">
      {slide.subtitle && (
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">
          <InlineText text={slide.subtitle} />
        </p>
      )}

      <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-heading sm:text-7xl">
        <InlineText text={slide.title} />
      </h1>

      {slide.image && (
        <img
          src={slide.image.src}
          alt={slide.image.alt}
          loading="lazy"
          className="mx-auto mt-10 max-h-[36vh] max-w-full rounded-2xl border border-border/10 object-contain shadow-2xl"
        />
      )}

      {slide.items.length > 0 && (
        <ul className="mx-auto mt-12 max-w-3xl space-y-5 text-left">
          {slide.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-xl leading-snug text-ink sm:text-2xl">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
              <span>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}