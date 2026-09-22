import type { Chart, Slide, SlideColumn, SlideImage } from '../lib/types'
import { ChartView } from './ChartView'
import { InlineText } from './InlineText'

interface SlideContentProps {
  title: string
  subtitle?: string
  items: string[]
  image?: SlideImage
  charts?: Chart[]
}

function SlideContent({ title, subtitle, items, image, charts }: SlideContentProps) {
  return (
    <>
      {subtitle && (
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">
          <InlineText text={subtitle} />
        </p>
      )}

      <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-heading sm:text-7xl">
        <InlineText text={title} />
      </h1>

      {image && (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="mx-auto mt-10 max-h-[36vh] max-w-full rounded-2xl border border-border/10 object-contain shadow-2xl"
        />
      )}

      {charts && charts.length > 0 && (
        <div className="mx-auto mt-10 grid w-full max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
          {charts.map((chart, i) => (
            <div
              key={i}
              className={charts.length === 1 ? 'lg:col-span-2' : ''}
            >
              <ChartView chart={chart} />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <ul className="mx-auto mt-12 max-w-3xl space-y-5 text-left">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-4 text-xl leading-snug text-ink sm:text-2xl"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
              <span>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function SlideColumnView({ column }: { column: SlideColumn }) {
  return (
    <div className="rounded-2xl border border-border/10 bg-surface/5 p-8 text-center shadow-2xl">
      <SlideContent
        title={column.title}
        subtitle={column.subtitle}
        items={column.items}
        image={column.image}
        charts={column.charts}
      />
    </div>
  )
}

export function SlideView({ slide }: { slide: Slide }) {
  if (slide.columns && slide.columns.length > 0) {
    return (
      <div className="flex w-full max-w-6xl flex-wrap items-stretch justify-center gap-6">
        {slide.columns.map((column, i) => (
          <div
            key={i}
            style={{ flex: `${column.flex} 1 0%` }}
            className="min-w-72 flex-1"
          >
            <SlideColumnView column={column} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl text-center">
      <SlideContent
        title={slide.title}
        subtitle={slide.subtitle}
        items={slide.items}
        image={slide.image}
        charts={slide.charts}
      />
    </div>
  )
}
