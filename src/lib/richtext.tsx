import { Fragment, type ReactNode } from "react";
import Link from "next/link";


const LINK_RE = /\[([^\]]{1,200})\]\(([^)\s]{1,2000})\)/g;
const INLINE_RE = /(\*[^*\n]{1,200}\*|~[^~\n]{1,200}~)/g;

function safeHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  return null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(...renderEmphasis(text.slice(last, start), `${keyPrefix}-t${i}`));
    const href = safeHref(m[2]);
    if (href) {
      const external = /^https?:/i.test(href);
      out.push(
        external ? (
          <a key={`${keyPrefix}-l${i}`} href={href} target="_blank" rel="noopener noreferrer">
            {m[1]}
          </a>
        ) : (
          <Link key={`${keyPrefix}-l${i}`} href={href}>
            {m[1]}
          </Link>
        ),
      );
    } else {
      out.push(<Fragment key={`${keyPrefix}-l${i}`}>{m[0]}</Fragment>);
    }
    last = start + m[0].length;
    i++;
  }
  if (last < text.length) out.push(...renderEmphasis(text.slice(last), `${keyPrefix}-e`));
  return out;
}

function renderEmphasis(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_RE).map((part, idx) => {
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*"))
      return <em key={`${keyPrefix}-${idx}`}>{part.slice(1, -1)}</em>;
    if (part.length > 2 && part.startsWith("~") && part.endsWith("~"))
      return <s key={`${keyPrefix}-${idx}`}>{part.slice(1, -1)}</s>;
    return <Fragment key={`${keyPrefix}-${idx}`}>{part}</Fragment>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => l.trim().startsWith("- "));
        const isQuote = lines.every((l) => l.trim().startsWith("> "));
        if (isList) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.trim().slice(2), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (isQuote) {
          return (
            <blockquote key={bi}>
              {lines.map((l, li) => (
                <Fragment key={li}>
                  {renderInline(l.trim().slice(2), `${bi}-${li}`)}
                  {li < lines.length - 1 && <br />}
                </Fragment>
              ))}
            </blockquote>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {renderInline(l, `${bi}-${li}`)}
                {li < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
