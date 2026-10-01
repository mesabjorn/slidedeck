import type {
  Chart,
  Slide,
  SlideColumn,
  SlideImage,
  SlideRevealStep,
} from "../lib/types";
import { getIcon } from "../lib/icons";
import type { LucideIcon } from "lucide-react";
import { ChartView, COLORS } from "./ChartView";
import { InlineText } from "./InlineText";

interface SlideContentProps {
  title: string;
  subtitle?: string;
  items: string[];
  image?: SlideImage;
  charts?: Chart[];
  reveal?: SlideRevealStep[];
  revealStep?: number;
  icon?: string;
  compact?: boolean;
}

function DecorativeIcon({ name }: { name?: string }) {
  if (!name) return null;
  const Glyph = getIcon(name) as LucideIcon | undefined;
  if (!Glyph) return null;
  return (
    <Glyph
      aria-hidden="true"
      className="mx-auto mb-8 h-20 w-20 text-accent opacity-90 sm:h-24 sm:w-24"
    />
  );
}

function SlideImageView({
  image,
  className = "mx-auto mt-10 max-h-[80vh]",
}: {
  image: SlideImage;
  className?: string;
}) {
  return (
    <img
      src={image.src}
      alt={image.alt}
      loading="lazy"
      className={`max-w-full rounded-2xl border border-border/10 object-contain shadow-2xl ${className}`}
    />
  );
}

function ChartGrid({
  charts,
  items,
  className = "max-w-4xl",
}: {
  items: string[];
  charts: Chart[];
  className?: string;
}) {
  return (
    <div
      className={`mx-auto mt-10 grid w-full grid-cols-1 gap-6 lg:grid-cols-2 ${className}`}
    >
      {charts.map((chart, i) => (
        <div key={i} className={charts.length === 1 ? "lg:col-span-2" : ""}>
          <ChartView chart={chart} />
          <GraphLegend items={items} />
        </div>
      ))}
    </div>
  );
}

function GraphLegend({ items }: { items: string[] }) {
  return (
    <ul className="mx-auto mt-12 max-w-3xl space-y-5 text-left">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-center gap-4 text-xl leading-snug text-ink sm:text-2xl"
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full`}
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          />
          <span>
            <InlineText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="mx-auto mt-12 max-w-3xl space-y-5 text-left">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-center gap-4 text-xl leading-snug text-ink sm:text-2xl"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-accent`} />
          <span>
            <InlineText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function RevealStepView({ step }: { step: SlideRevealStep }) {
  return (
    <div className="animate-slide-in">
      {step.image && (
        <SlideImageView
          image={step.image}
          className="mx-auto mt-10 max-h-[55vh]"
        />
      )}
      {step.charts && step.charts.length > 0 && (
        <ChartGrid
          charts={step.charts}
          className="max-w-3xl"
          items={step.items || []}
        />
      )}
      {step.text && (
        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
          <InlineText text={step.text} />
        </p>
      )}
      {step.items && step.items.length > 0 && <ItemList items={step.items} />}
    </div>
  );
}

// A block of nothing but images shares one box: every new step covers the one
// below it, nudged down and right so the pile underneath stays readable. All
// layers sit in the same grid cell, so the box grows to the largest image and
// each one keeps its own aspect ratio.
function RevealOverlay({ images }: { images: SlideImage[] }) {
  const top = images.length - 1;
  return (
    <div className="mx-auto mt-10 grid w-full">
      {images.map((image, i) => (
        <img
          key={i}
          src={image.src}
          alt={image.alt}
          loading="lazy"
          style={{
            gridArea: "1 / 1",
            zIndex: i,
            transform: `translate(${i * 8}px, ${i * 8}px)`,
            filter: `brightness(${Math.max(20, 100 - (top - i) * 40)}%)`,
          }}
          className="max-h-[55vh] max-w-full place-self-center rounded-2xl border border-border/10 object-contain shadow-2xl"
        />
      ))}
    </div>
  );
}

function isImageOnlyReveal(reveal: SlideRevealStep[]): boolean {
  return (
    reveal.length > 0 &&
    reveal.every(
      (step) =>
        step.image !== undefined &&
        !step.text &&
        !step.items?.length &&
        !step.charts?.length,
    )
  );
}

function RevealSteps({
  reveal,
  revealStep,
}: {
  reveal: SlideRevealStep[];
  revealStep: number;
}) {
  if (revealStep <= 0) return null;
  const shown = reveal.slice(0, revealStep);

  if (isImageOnlyReveal(reveal)) {
    return (
      <div className="animate-slide-in">
        <RevealOverlay
          images={shown.flatMap((step) => (step.image ? [step.image] : []))}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {shown.map((step, i) => (
        <RevealStepView key={i} step={step} />
      ))}
    </div>
  );
}

function SlideContent({
  title,
  subtitle,
  items,
  image,
  charts,
  reveal,
  revealStep = 0,
  icon,
  compact = false,
}: SlideContentProps) {
  return (
    <>
      <DecorativeIcon name={icon} />

      {subtitle && (
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">
          <InlineText text={subtitle} />
        </p>
      )}

      {title &&
        (compact ? (
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-heading">
            <InlineText text={title} />
          </h2>
        ) : (
          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-heading sm:text-7xl">
            <InlineText text={title} />
          </h1>
        ))}
      {image && <SlideImageView image={image} />}
      {charts && charts.length > 0 && (
        <ChartGrid charts={charts} items={items} />
      )}
      {items.length > 0 && !charts && <ItemList items={items} />}
      {reveal && reveal.length > 0 && (
        <RevealSteps reveal={reveal} revealStep={revealStep} />
      )}
    </>
  );
}

function SlideColumnView({
  column,
  revealStep,
}: {
  column: SlideColumn;
  revealStep: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/10 bg-surface/5 p-8 text-center shadow-2xl">
      <SlideContent
        title={column.title}
        subtitle={column.subtitle}
        items={column.items}
        image={column.image}
        charts={column.charts}
        reveal={column.reveal}
        revealStep={Math.min(revealStep, column.reveal?.length ?? 0)}
        icon={column.icon}
        compact
      />
    </div>
  );
}

export function SlideView({
  slide,
  revealStep = 0,
}: {
  slide: Slide;
  revealStep?: number;
}) {
  if (slide.columns && slide.columns.length > 0) {
    return (
      <div className="flex w-full max-w-6xl flex-col items-center gap-10">
        <h1 className="mt-2 text-5xl font-bold leading-tight tracking-tight text-heading sm:text-7xl">
          <InlineText text={slide.title} />
        </h1>
        <div className="flex w-full flex-wrap items-stretch justify-center gap-6">
          {slide.columns.map((column, i) => (
            <div
              key={i}
              style={{ flex: `${column.flex} 1 0%` }}
              className="min-w-72 flex-1"
            >
              <SlideColumnView column={column} revealStep={revealStep} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl text-center">
      <SlideContent
        title={slide.title}
        subtitle={slide.subtitle}
        items={slide.items}
        image={slide.image}
        charts={slide.charts}
        reveal={slide.reveal}
        revealStep={revealStep}
        icon={slide.icon}
      />
    </div>
  );
}
