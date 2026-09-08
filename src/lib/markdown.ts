import type { Slide } from './types'

const SLIDE_SEPARATOR_RE = /^---\s*$/m
const H1_RE = /^#\s+(.*)$/
const H2_RE = /^##\s+(.*)$/
const BULLET_RE = /^[-*+]\s+(.*)$/
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/

export function parseSlides(source: string, sourceFile: string): Slide[] {
  const blocks = source
    .split(SLIDE_SEPARATOR_RE)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)

  return blocks
    .map((block, index) => parseSlide(block, sourceFile, index))
    .filter((slide): slide is Slide => slide !== null)
}

function parseSlide(block: string, sourceFile: string, index: number): Slide | null {
  let title = ''
  const subtitleLines: string[] = []
  const items: string[] = []

  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const h1 = H1_RE.exec(line)
    if (h1) {
      if (!title) title = h1[1]
      continue
    }

    const h2 = H2_RE.exec(line)
    if (h2) {
      subtitleLines.push(h2[1])
      continue
    }

    const bullet = BULLET_RE.exec(line) ?? NUMBERED_RE.exec(line)
    if (bullet) {
      items.push(bullet[1])
      continue
    }

    if (!/^[#>]/.test(line)) {
      subtitleLines.push(line)
    }
  }

  if (!title && items.length === 0 && subtitleLines.length === 0) {
    return null
  }

  return {
    id: `${sourceFile}#${index}`,
    title: title || sourceFile.replace(/\.md$/i, ''),
    subtitle: subtitleLines.length > 0 ? subtitleLines.join(' ') : undefined,
    items,
  }
}