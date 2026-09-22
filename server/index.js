import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import {
  parseSlides,
  parseInlineChartData,
  resolveMediaInText,
  resolveMediaPath,
} from "./markdown.js";
import { parseCsv, csvToChartData } from "./csv.js";

import { STARTER_SLIDES } from "./starter_slides.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "content");
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 3001;

const ID_RE = /^[\w.-]+$/;
const app = express();
app.use(express.json());

const STARTER_INDEX = [
  { name: "Start", slides: ["01-welcome.md", "02-structure.md"] },
  { name: "Next steps", slides: ["03-getting-started.md"] },
];

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function slugify(text) {
  const slug = String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

function ensureUniqueId(base, existingIds) {
  let id = base;
  let counter = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  return id;
}

function toSections(value) {
  const all = Array.isArray(value) ? value : [];
  const isSections =
    all.length > 0 &&
    all.every(
      (entry) => entry && typeof entry === "object" && "slides" in entry,
    );
  const sections = isSections ? all : [{ hidden: false, slides: all }];
  return sections.map((section) => ({
    name: section.name,
    hidden: Boolean(section.hidden),
    entries: (Array.isArray(section.slides) ? section.slides : []).map(
      (entry) =>
        typeof entry === "string"
          ? { file: entry, hidden: false }
          : { file: entry?.file, hidden: Boolean(entry?.hidden) },
    ),
  }));
}

function visibleSlideEntries(value) {
  return toSections(value)
    .filter((section) => !section.hidden)
    .flatMap((section) => section.entries)
    .filter((entry) => !entry.hidden);
}

function visibleSlideFiles(value) {
  return visibleSlideEntries(value).map((entry) => entry.file);
}

function resolveDeckFile(id, relative) {
  const deckDir = path.join(CONTENT_DIR, id);
  const rel = relative.replace(/^\.\//, "").replace(new RegExp(`^${id}/`), "");
  const filePath = path.resolve(deckDir, rel);
  return filePath.startsWith(deckDir + path.sep) ? filePath : null;
}

async function resolveCharts(charts, id) {
  return Promise.all(
    charts.map(async (chart) => {
      if (chart.src.startsWith("inline:")) {
        return {
          type: chart.type,
          data: parseInlineChartData(chart.src.slice("inline:".length)),
        };
      }
      const filePath = resolveDeckFile(id, chart.src);
      if (!filePath) throw new Error(`Invalid chart data path: ${chart.src}`);
      const text = await readFile(filePath, "utf8");
      return { type: chart.type, data: csvToChartData(parseCsv(text)) };
    }),
  );
}

app.post("/api/presentations", async (req, res) => {
  try {
    const { title, description } = req.body ?? {};
    const name = String(title ?? "").trim();
    if (!name) {
      return res.status(400).json({ error: "A title is required" });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: "Title is too long" });
    }

    const presentationsFile = path.join(CONTENT_DIR, "presentations.json");
    const presentations = await readJson(presentationsFile);
    const id = ensureUniqueId(
      slugify(name),
      presentations.map((presentation) => presentation.id),
    );

    const slidesDir = path.join(CONTENT_DIR, id, "slides");
    await mkdir(slidesDir, { recursive: true });
    for (const [file, content] of Object.entries(STARTER_SLIDES)) {
      await writeFile(path.join(slidesDir, file), content);
    }
    await writeFile(
      path.join(slidesDir, "index.json"),
      `${JSON.stringify(STARTER_INDEX, null, 2)}\n`,
    );

    const meta = {
      id,
      title: name,
      description: String(description ?? "A brand-new presentation."),
    };
    presentations.push(meta);
    await writeFile(
      presentationsFile,
      `${JSON.stringify(presentations, null, 2)}\n`,
    );

    res
      .status(201)
      .json({ ...meta, slideCount: visibleSlideFiles(STARTER_INDEX).length });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

app.get("/api/presentations", async (_req, res) => {
  try {
    const presentations = await readJson(
      path.join(CONTENT_DIR, "presentations.json"),
    );
    const withCounts = await Promise.all(
      presentations.map(async (presentation) => {
        try {
          const files = await readJson(
            path.join(CONTENT_DIR, presentation.id, "slides", "index.json"),
          );
          return {
            ...presentation,
            slideCount: Array.isArray(files)
              ? visibleSlideFiles(files).length
              : 0,
          };
        } catch {
          return { ...presentation, slideCount: 0 };
        }
      }),
    );
    res.json(withCounts);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

app.get("/api/presentations/:id/slides", async (req, res) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) {
    return res.status(400).json({ error: "Invalid presentation id" });
  }

  try {
    const index = await readJson(
      path.join(CONTENT_DIR, id, "slides", "index.json"),
    );
    const sections = toSections(index);
    const resolve = (src) => resolveMediaPath(src, id);

    const parsed = [];
    for (const section of sections) {
      if (section.hidden) continue;
      for (const entry of section.entries) {
        if (entry.hidden) continue;
        const text = await readFile(
          path.join(CONTENT_DIR, id, "slides", entry.file),
          "utf8",
        );
        const slides = parseSlides(text, entry.file);
        const resolved = await Promise.all(
          slides.map(async (slide) => ({
            ...slide,
            title: resolveMediaInText(slide.title, resolve),
            subtitle: slide.subtitle
              ? resolveMediaInText(slide.subtitle, resolve)
              : undefined,
            items: slide.items.map((item) => resolveMediaInText(item, resolve)),
            image: slide.image
              ? { ...slide.image, src: resolve(slide.image.src) }
              : undefined,
            charts: slide.charts
              ? await resolveCharts(slide.charts, id)
              : undefined,
            section: section.name,
          })),
        );
        parsed.push(...resolved);
      }
    }

    res.json({ id, slides: parsed });
  } catch (err) {
    const status = err && err.code === "ENOENT" ? 404 : 500;
    res
      .status(status)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

app.get("/api/presentations/:id/images/*splat", (req, res) => {
  const { id, splat } = req.params;
  if (!ID_RE.test(id)) {
    return res.status(400).json({ error: "Invalid presentation id" });
  }

  const imagesDir = path.join(CONTENT_DIR, id, "images");
  const relative = Array.isArray(splat) ? splat.join("/") : splat;
  const filePath = path.resolve(imagesDir, relative);
  if (!filePath.startsWith(imagesDir + path.sep)) {
    return res.status(400).json({ error: "Invalid path" });
  }

  res.sendFile(filePath, (err) => {
    if (err) res.status(404).json({ error: "File not found" });
  });
});

app.get("/api/presentations/:id/data/*splat", async (req, res) => {
  const { id, splat } = req.params;
  if (!ID_RE.test(id)) {
    return res.status(400).json({ error: "Invalid presentation id" });
  }

  const dataDir = path.join(CONTENT_DIR, id, "data");
  const relative = Array.isArray(splat) ? splat.join("/") : splat;
  const filePath = path.resolve(dataDir, relative);
  if (!filePath.startsWith(dataDir + path.sep)) {
    return res.status(400).json({ error: "Invalid path" });
  }

  try {
    const text = await readFile(filePath, "utf8");
    res.json(parseCsv(text));
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(DIST_DIR, "index.html"), (err) => {
        if (err) next(err);
      });
    }
    next();
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`SlideDeck server listening on http://localhost:${PORT}`);
  if (existsSync(DIST_DIR)) {
    console.log(`Serving built client from ${DIST_DIR}`);
  }
});
