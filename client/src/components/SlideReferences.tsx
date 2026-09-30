import { useState } from "react";
import { BookMarked } from "lucide-react";
import { InlineText } from "./InlineText";

const BARE_URL_SPLIT_RE = /(https?:\/\/[^\s]*[^\s.,;:!?()[\]])/g;

function ReferenceText({ text }: { text: string }) {
  return (
    <>
      {text.split(BARE_URL_SPLIT_RE).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-strong"
          >
            {part}
          </a>
        ) : (
          <InlineText key={i} text={part} />
        ),
      )}
    </>
  );
}

export function SlideReferences({ references }: { references?: string[] }) {
  const [open, setOpen] = useState(false);

  if (!references || references.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onClick={() => setOpen((prev) => !prev)}
    >
      {open && (
        <div className="right-0 bottom-full z-30 absolute flex flex-col bg-panel shadow-2xl mb-3 border border-border/15 rounded-2xl w-[min(26rem,80vw)] max-h-[55vh] overflow-hidden">
          <p className="px-4 py-2 border-border/10 border-b font-mono text-[0.7rem] text-faint uppercase tracking-[0.25em]">
            References
          </p>
          <ol className="px-4 py-3 overflow-y-auto text-muted text-xs leading-relaxed">
            {references.map((reference, i) => (
              <li key={i} className="mb-2 last:mb-0">
                <ReferenceText text={reference} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        title={`References (${references.length})`}
        aria-label={`References, ${references.length} on this slide`}
        className="flex items-center gap-1.5 bg-surface/10 hover:bg-surface/20 px-2.5 py-1.5 rounded-full text-faint hover:text-heading transition"
      >
        <BookMarked className="w-4 h-4" />
        <span className="font-mono text-xs">{references.length}</span>
      </button>
    </div>
  );
}
