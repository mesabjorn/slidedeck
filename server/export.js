import { readFile } from "node:fs/promises";
import path from "node:path";

const INLINE_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const MIME_TYPES = {
  ".apng": "image/apng",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function imagePath(src, id, contentDir) {
  const prefix = `/api/presentations/${id}/images/`;
  if (!src.startsWith(prefix)) return null;

  let relative;
  try {
    relative = decodeURIComponent(src.slice(prefix.length));
  } catch {
    throw new Error(`Invalid image path: ${src}`);
  }

  const imagesDir = path.resolve(contentDir, id, "images");
  const filePath = path.resolve(imagesDir, relative);
  if (filePath !== imagesDir && !filePath.startsWith(imagesDir + path.sep)) {
    throw new Error(`Invalid image path: ${src}`);
  }
  return filePath;
}

function mimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

async function embedImageSource(src, id, contentDir, cache) {
  if (typeof src !== "string" || !src.startsWith(`/api/presentations/${id}/images/`)) {
    return src;
  }

  const filePath = imagePath(src, id, contentDir);
  if (!cache.has(filePath)) {
    cache.set(
      filePath,
      readFile(filePath).then(
        (buffer) => `data:${mimeType(filePath)};base64,${buffer.toString("base64")}`,
      ),
    );
  }
  return cache.get(filePath);
}

async function embedTextImages(text, id, contentDir, cache) {
  if (typeof text !== "string" || !text.includes("![")) return text;

  const matches = [...text.matchAll(INLINE_IMAGE_RE)];
  if (matches.length === 0) return text;

  let result = "";
  let cursor = 0;
  for (const match of matches) {
    const index = match.index ?? 0;
    const source = await embedImageSource(match[2], id, contentDir, cache);
    result += text.slice(cursor, index);
    result += `![${match[1]}](${source})`;
    cursor = index + match[0].length;
  }
  return result + text.slice(cursor);
}

async function embedColumnImages(column, id, contentDir, cache) {
  const result = {
    ...column,
    title: await embedTextImages(column.title, id, contentDir, cache),
    items: await Promise.all(
      column.items.map((item) => embedTextImages(item, id, contentDir, cache)),
    ),
  };

  if (column.subtitle !== undefined) {
    result.subtitle = await embedTextImages(column.subtitle, id, contentDir, cache);
  }
  if (column.image !== undefined) {
    result.image = {
      ...column.image,
      src: await embedImageSource(column.image.src, id, contentDir, cache),
    };
  }
  return result;
}

async function embedSlideImages(slide, id, contentDir, cache) {
  const result = {
    ...slide,
    title: await embedTextImages(slide.title, id, contentDir, cache),
    items: await Promise.all(
      slide.items.map((item) => embedTextImages(item, id, contentDir, cache)),
    ),
  };

  if (slide.subtitle !== undefined) {
    result.subtitle = await embedTextImages(slide.subtitle, id, contentDir, cache);
  }
  if (slide.image !== undefined) {
    result.image = {
      ...slide.image,
      src: await embedImageSource(slide.image.src, id, contentDir, cache),
    };
  }
  if (slide.columns !== undefined) {
    result.columns = await Promise.all(
      slide.columns.map((column) => embedColumnImages(column, id, contentDir, cache)),
    );
  }
  return result;
}

export async function compileSlidesExport(payload, id, contentDir) {
  const cache = new Map();
  const slides = await Promise.all(
    payload.slides.map((slide) => embedSlideImages(slide, id, contentDir, cache)),
  );
  return { ...payload, slides };
}
