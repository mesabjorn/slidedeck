const SLIDE_SEPARATOR_RE = /^---\s*$/m
const COLUMN_SEPARATOR_RE = /^~~~\s*$/m
const H1_RE = /^#\s+(.*)$/
const H2_RE = /^##\s+(.*)$/
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/
const CHART_RE = /^chart:(\w+)$/
const BULLET_RE = /^[-*+]\s+(.*)$/
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/
const INLINE_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g

export function resolveMediaPath(src, presentationId) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/') || src.startsWith('data:')) {
    return src
  }
  const relative = src
    .replace(/^\.\//, '')
    .replace(new RegExp(`^${presentationId}/`), '')
    .replace(/^images\//, '')
  return `/api/presentations/${presentationId}/images/${relative}`
}

export function resolveMediaInText(text, resolve) {
  return text.replace(INLINE_IMAGE_RE, (_match, alt, src) => `![${alt}](${resolve(src)})`)
}

export function parseInlineChartData(raw) {
  const [headerPart, ...valueParts] = raw.split(';')
  const labels = headerPart.split(',').map((label) => label.trim())
  const values = valueParts
    .flatMap((part) => part.split(','))
    .map((value) => Number(value.trim()))
  return { labels, series: [{ name: 'value', values }] }
}

export function parseSlides(source, sourceFile) {
  return splitBlocks(source)
    .map((block, index) => parseSlide(block, sourceFile, index))
    .filter((slide) => slide !== null)
}

export function parseColumns(source, sourceFile) {
  return splitBlocks(source, COLUMN_SEPARATOR_RE)
    .map((block, index) => parseSlide(block, sourceFile, index, false))
    .filter((slide) => slide !== null)
}

function splitBlocks(source, separator = SLIDE_SEPARATOR_RE) {
  return source
    .split(separator)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
}

function parseSlide(block, sourceFile, index, fallbackTitle = true) {
  let title = ''
  const subtitleLines = []
  const items = []
  const charts = []
  let image

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

    const img = IMAGE_RE.exec(line)
    if (img) {
      const chartType = CHART_RE.exec(img[1])
      if (chartType) {
        charts.push({ type: chartType[1], src: img[2] })
        continue
      }
      if (!image) image = { src: img[2], alt: img[1] }
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

  const hasContent = items.length > 0 || subtitleLines.length > 0 || charts.length > 0 || image !== undefined
  if (!title && !hasContent) {
    return null
  }

  return {
    id: `${sourceFile}#${index}`,
    title: title || (fallbackTitle ? sourceFile.replace(/\.md$/i, '') : ''),
    subtitle: subtitleLines.length > 0 ? subtitleLines.join(' ') : undefined,
    items,
    image,
    charts: charts.length > 0 ? charts : undefined,
  }
}