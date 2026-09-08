import { useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { Chart, ChartSeries } from '../lib/types'
import { TooltipBubble } from './Tooltip'

const COLORS = [
  'var(--color-accent)',
  'var(--color-accent-strong)',
  'var(--color-muted)',
  'var(--color-heading)',
]

const W = 640
const H = 320
const PAD = { top: 20, right: 16, bottom: 36, left: 46 }
const PIE_SIZE = 340
const PIE_CENTER = 170
const PIE_RADIUS = 140

interface Hover {
  index: number
  x: number
  y: number
}

function niceMax(max: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(max, 1)))
  const normalized = Math.max(max, 1) / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100)
}

function truncate(label: string): string {
  return label.length > 14 ? `${label.slice(0, 13)}…` : label
}

function polarPoint(cx: number, cy: number, r: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180
  return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) }
}

export function ChartView({ chart }: { chart: Chart }) {
  const type = chart.type === 'pie' ? 'pie' : chart.type === 'line' ? 'line' : 'bar'
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  const labels = chart.data.labels
  const series = chart.data.series
  const pieValues = series[0]?.values ?? []
  const pieTotal = pieValues.reduce((sum, value) => sum + value, 0)

  const leave = () => setHover(null)

  const move = (event: ReactMouseEvent<SVGElement>, index: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ index, x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  if (
    (labels.length === 0 || series.length === 0) ||
    (type === 'pie' && pieTotal <= 0)
  ) {
    return <div className="py-8 text-center text-sm text-faint">No data</div>
  }

  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const groupW = plotW / labels.length
  const n = series.length
  const yFor = (value: number) => PAD.top + plotH - (value / max) * plotH
  const xFor = (index: number) => PAD.left + index * groupW + groupW / 2
  const ticks = 4

  const renderGrid = () => (
    <>
      {Array.from({ length: ticks + 1 }, (_, t) => {
        const value = (max / ticks) * t
        const y = yFor(value)
        return (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeOpacity={0.15}
            />
            <text
              x={PAD.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-faint)"
            >
              {formatTick(value)}
            </text>
          </g>
        )
      })}
      {labels.map((label, gi) => (
        <text
          key={gi}
          x={xFor(gi)}
          y={H - PAD.bottom + 16}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-faint)"
        >
          {truncate(label)}
        </text>
      ))}
    </>
  )

  const renderBars = () => {
    const barW = Math.max(Math.min((groupW * 0.7) / n, 42), 3)
    return labels.map((_label, gi) =>
      series.map((entry: ChartSeries, si) => {
        const value = entry.values[gi] ?? 0
        const x = PAD.left + gi * groupW + (groupW - barW * n) / 2 + si * barW
        const y = yFor(value)
        const barH = Math.max(PAD.top + plotH - y, 0)
        return (
          <rect
            key={`${gi}-${si}`}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={3}
            fill={COLORS[si % COLORS.length]}
            className="cursor-pointer transition-opacity hover:opacity-80"
            onMouseMove={(event) => move(event, gi)}
            onMouseLeave={leave}
          />
        )
      }),
    )
  }

  const renderLine = () => (
    <>
      {series.map((entry, si) => (
        <g key={si}>
          <polyline
            points={entry.values.map((value, gi) => `${xFor(gi)},${yFor(value)}`).join(' ')}
            fill="none"
            stroke={COLORS[si % COLORS.length]}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {entry.values.map((value, gi) => (
            <circle
              key={gi}
              cx={xFor(gi)}
              cy={yFor(value)}
              r={5}
              fill={COLORS[si % COLORS.length]}
              stroke="var(--color-bg)"
              strokeWidth={1.5}
              className="cursor-pointer"
              onMouseMove={(event) => move(event, gi)}
              onMouseLeave={leave}
            />
          ))}
        </g>
      ))}
    </>
  )

  const renderPie = () => {
    const slices: ReactNode[] = []
    let angle = 0
    labels.forEach((_, i) => {
      const value = pieValues[i] ?? 0
      if (value <= 0) return
      const start = angle
      const sweep = (value / pieTotal) * 360
      angle += sweep
      const largeArc = sweep > 180 ? 1 : 0
      const a = polarPoint(PIE_CENTER, PIE_CENTER, PIE_RADIUS, start)
      const b = polarPoint(PIE_CENTER, PIE_CENTER, PIE_RADIUS, start + sweep)
      slices.push(
        <path
          key={i}
          d={`M ${a.x} ${a.y} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArc} 1 ${b.x} ${b.y} L ${PIE_CENTER} ${PIE_CENTER} Z`}
          fill={COLORS[i % COLORS.length]}
          stroke="var(--color-bg)"
          strokeWidth={2}
          transform={`rotate(-90 ${PIE_CENTER} ${PIE_CENTER})`}
          className="cursor-pointer transition-opacity hover:opacity-80"
          onMouseMove={(event) => move(event, i)}
          onMouseLeave={leave}
        />,
      )
    })
    return slices
  }

  const bubbleContent = hover ? (
    <>
      <div className="font-medium text-heading">{labels[hover.index] ?? ''}</div>
      {type === 'pie' ? (
        <div className="text-muted">
          {pieValues[hover.index] ?? 0} · {Math.round(((pieValues[hover.index] ?? 0) / pieTotal) * 100)}%
        </div>
      ) : (
        series.map((entry, si) => (
          <div key={si} className="flex items-center gap-1.5 text-muted">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[si % COLORS.length] }}
            />
            <span>
              {entry.name}: {entry.values[hover.index] ?? 0}
            </span>
          </div>
        ))
      )}
    </>
  ) : null

  return (
    <div
      ref={containerRef}
      className="relative"
      role="img"
      aria-label={`${type} chart for ${labels[0] ?? ''}…`}
    >
      <svg
        viewBox={`0 0 ${type === 'pie' ? PIE_SIZE : W} ${type === 'pie' ? PIE_SIZE : H}`}
        className="h-auto w-full"
      >
        {type === 'pie' ? renderPie() : (
          <g>
            {renderGrid()}
            {type === 'bar' ? renderBars() : renderLine()}
          </g>
        )}
      </svg>

      {hover && (
        <TooltipBubble
          style={{ left: hover.x, top: hover.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          {bubbleContent}
        </TooltipBubble>
      )}
    </div>
  )
}