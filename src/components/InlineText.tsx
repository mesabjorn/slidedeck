import { Fragment } from 'react'

type Token =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'image'; alt: string; src: string }

const TOKEN_RE = /(\*\*[^*]+\*\*|`[^`]+`|!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g

function tokenize(text: string): Token[] {
  return text
    .split(TOKEN_RE)
    .filter(Boolean)
    .map((part): Token => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return { type: 'bold', text: part.slice(2, -2) }
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return { type: 'code', text: part.slice(1, -1) }
      }
      const image = part.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
      if (image) {
        return { type: 'image', alt: image[1], src: image[2] }
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        return { type: 'link', text: link[1], href: link[2] }
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return { type: 'italic', text: part.slice(1, -1) }
      }
      return { type: 'text', text: part }
    })
}

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {tokenize(text).map((token, i) => {
        switch (token.type) {
          case 'bold':
            return (
              <strong key={i} className="font-semibold text-white">
                {token.text}
              </strong>
            )
          case 'italic':
            return (
              <em key={i} className="italic">
                {token.text}
              </em>
            )
          case 'code':
            return (
              <code
                key={i}
                className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-300"
              >
                {token.text}
              </code>
            )
          case 'link':
            return (
              <a
                key={i}
                href={token.href}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300"
              >
                {token.text}
              </a>
            )
          case 'image':
            return (
              <img
                key={i}
                src={token.src}
                alt={token.alt}
                className="inline-block align-[-0.2em]"
                style={{ height: '1.2em', width: 'auto' }}
                loading="lazy"
              />
            )
          default:
            return <Fragment key={i}>{token.text}</Fragment>
        }
      })}
    </>
  )
}