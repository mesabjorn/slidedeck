import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export function TooltipBubble({
  style,
  children,
}: {
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div
      style={style}
      className="pointer-events-none absolute z-50 max-w-xs rounded-lg border border-border/15 bg-panel px-3 py-1.5 text-xs leading-snug text-ink shadow-xl"
      role="tooltip"
    >
      {children}
    </div>
  )
}

export function InlineTooltip({ term, hint }: { term: string; hint: string }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-accent/70 outline-none"
      >
        {term}
      </span>
      {open && (
        <TooltipBubble style={{ left: 0, top: '100%', marginTop: 6 }}>{hint}</TooltipBubble>
      )}
    </span>
  )
}