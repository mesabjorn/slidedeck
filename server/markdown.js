const SLIDE_SEPARATOR_RE = /^---\s*$/m;
const COLUMN_SEPARATOR_RE = /^~~~\s*$/m;
const H1_RE = /^#\s+(.*)$/;
const H2_RE = /^##\s+(.*)$/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const CHART_RE = /^chart:(\w+)$/;
const BULLET_RE = /^[-*+]\s+(.*)$/;
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/;
const INLINE_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const REFERENCE_RE = /^>\s*(.*)$/;
const ICON_RE = /^:([a-z][a-z0-9]*(?:-[a-z0-9]+)*):$/;
const REVEAL_OPEN_RE = /^:::click\s*$/;
const REVEAL_CLOSE_RE = /^:::\s*$/;

export function resolveMediaPath(src, presentationId) {
  if (
    /^(https?:)?\/\//.test(src) ||
    src.startsWith("/") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  const relative = src
    .replace(/^\.\//, "")
    .replace(new RegExp(`^${presentationId}/`), "")
    .replace(/^images\//, "");
  return `/api/presentations/${presentationId}/images/${relative}`;
}

export function resolveMediaInText(text, resolve) {
  return text.replace(
    INLINE_IMAGE_RE,
    (_match, alt, src) => `![${alt}](${resolve(src)})`,
  );
}

export function parseInlineChartData(raw) {
  const [headerPart, ...valueParts] = raw.split(";");
  const labels = headerPart.split(",").map((label) => label.trim());
  const values = valueParts
    .flatMap((part) => part.split(","))
    .map((value) => Number(value.trim()));
  return { labels, series: [{ name: "value", values }] };
}

export function parseSlides(source, sourceFile) {
  // split slides by horizontal rule
  return splitBlocks(source)
    .map((block, index) => parseSlide(block, sourceFile, index))
    .filter((slide) => slide !== null);
}

export function parseColumns(source, sourceFile) {
  //split text of slide by ~~~
  return splitBlocks(source, COLUMN_SEPARATOR_RE)
    .map((block, index) => parseSlide(block, sourceFile, index, false))
    .filter((slide) => slide !== null);
}

function splitBlocks(source, separator = SLIDE_SEPARATOR_RE) {
  return source
    .split(separator)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

function parseSlide(block, sourceFile, index, fallbackTitle = true) {
  let title = "";
  const subtitleLines = [];
  const items = [];
  const charts = [];
  const references = [];
  const reveal = [];
  let image;
  let decorativeIcon;
  let inReveal = false;
  let step;

  const flushStep = () => {
    const finished = finishRevealStep(step);
    if (finished) reveal.push(finished);
    step = undefined;
  };

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();

    if (inReveal) {
      if (REVEAL_CLOSE_RE.test(line)) {
        flushStep();
        inReveal = false;
        continue;
      }
      if (REVEAL_OPEN_RE.test(line)) continue;
      if (!line) {
        flushStep();
        continue;
      }
      step ??= {};
      addRevealLine(line, step);
      continue;
    }

    if (!line) continue;

    if (REVEAL_OPEN_RE.test(line)) {
      inReveal = true;
      continue;
    }

    const h1 = H1_RE.exec(line);
    if (h1) {
      if (!title) title = h1[1];
      continue;
    }

    const h2 = H2_RE.exec(line);
    if (h2) {
      subtitleLines.push(h2[1]);
      continue;
    }

    const img = IMAGE_RE.exec(line);
    if (img) {
      const chartType = CHART_RE.exec(img[1]);
      if (chartType) {
        charts.push({ type: chartType[1], src: img[2] });
        continue;
      }
      if (!image) image = { src: img[2], alt: img[1] };
      continue;
    }

    const reference = REFERENCE_RE.exec(line);
    if (reference) {
      if (reference[1]) references.push(reference[1]);
      continue;
    }

    const bullet = BULLET_RE.exec(line) ?? NUMBERED_RE.exec(line);
    if (bullet) {
      items.push(bullet[1]);
      continue;
    }

    const icon = ICON_RE.exec(line);
    if (icon) {
      if (!decorativeIcon) decorativeIcon = icon[1];
      continue;
    }

    if (!/^[#>]/.test(line)) {
      subtitleLines.push(line);
    }
  }

  const hasContent =
    items.length > 0 ||
    subtitleLines.length > 0 ||
    charts.length > 0 ||
    references.length > 0 ||
    reveal.length > 0 ||
    decorativeIcon !== undefined ||
    image !== undefined;
  if (!title && !hasContent) {
    return null;
  }

  flushStep();

  return {
    id: `${sourceFile}#${index}`,
    title: title || (fallbackTitle ? sourceFile.replace(/\.md$/i, "") : ""),
    subtitle: subtitleLines.length > 0 ? subtitleLines.join(" ") : undefined,
    items,
    image,
    charts: charts.length > 0 ? charts : undefined,
    references: references.length > 0 ? references : undefined,
    reveal: reveal.length > 0 ? reveal : undefined,
    icon: decorativeIcon,
  };
}

// One line of a :::click block: a block image, a chart, a bullet, or plain text.
function addRevealLine(line, step) {
  const img = IMAGE_RE.exec(line);
  if (img) {
    const chartType = CHART_RE.exec(img[1]);
    if (chartType) {
      step.charts ??= [];
      step.charts.push({ type: chartType[1], src: img[2] });
    } else if (!step.image) {
      step.image = { src: img[2], alt: img[1] };
    }
    return;
  }

  const bullet = BULLET_RE.exec(line) ?? NUMBERED_RE.exec(line);
  if (bullet) {
    step.items ??= [];
    step.items.push(bullet[1]);
    return;
  }

  step.text = step.text ? `${step.text} ${line}` : line;
}

function finishRevealStep(step) {
  if (!step || (!step.text && !step.items && !step.charts && !step.image)) {
    return null;
  }
  return {
    text: step.text,
    items: step.items,
    image: step.image,
    charts: step.charts,
  };
}
