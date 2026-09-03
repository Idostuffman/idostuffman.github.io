"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent, useStrings } from "@/content/ContentProvider";
import { RichText } from "@/lib/richtext";
import { useReducedMotion } from "@/lib/utils";
import { asset } from "@/lib/asset";

export function CommissionSite() {
  const content = useContent();
  const t = useStrings();
  const reduced = useReducedMotion();
  const [transitioning, setTransitioning] = useState(true);
  const c = content.commissions;
  const byId = new Map(content.art.works.map((w) => [w.id, w]));
  const gallery = c.gallery.map((id) => byId.get(id)).filter((w): w is NonNullable<typeof w> => !!w);

  useEffect(() => {
    const tm = window.setTimeout(() => setTransitioning(false), reduced ? 0 : 950);
    return () => window.clearTimeout(tm);
  }, [reduced]);

  const statusLabel = c.status === "open" ? "Commissions open" : c.status === "limited" ? "Limited availability" : "Commissions closed";

  return (
    <div className="normal">
      {transitioning && !reduced && (
        <div className="normal-transition" aria-hidden="true">
          {t("commissions.transition", "loading normal website")}…
        </div>
      )}
      <nav className="normal__nav" aria-label="commissions">
        <Link href="/commissions" className="normal__brand">
          {content.identity.name}
        </Link>
        <ul>
          <li>
            <a href="#services">Services</a>
          </li>
          <li>
            <a href="#process">Process</a>
          </li>
          <li>
            <a href="#terms">Terms</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
          <li>
            <Link href="/" className="normal__back">
              ← Back to the site
            </Link>
          </li>
        </ul>
      </nav>

      <header>
        <h1>{c.headline}</h1>
        <span className={`normal__status normal__status--${c.status}`}>{statusLabel}</span>
        {c.statusNote && <p style={{ marginTop: 0 }}>{c.statusNote}</p>}
        <RichText text={c.intro} />
      </header>

      <section id="services" aria-labelledby="services-h">
        <h2 id="services-h">Services & pricing</h2>
        <div className="normal__types">
          {c.types.map((tp) => (
            <article key={tp.id} className="normal__type" data-available={tp.available}>
              <h3>{tp.name}</h3>
              <p className="normal__price">{tp.price}</p>
              <RichText text={tp.description} />
              {!tp.available && <p style={{ fontSize: "0.85rem", color: "#7a2a24" }}>Not currently available.</p>}
              {tp.examples.length > 0 && (
                <div className="normal__examples">
                  {tp.examples.map((id) => {
                    const w = byId.get(id);
                    return w ? <img key={id} src={asset(w.image)} alt={w.title} loading="lazy" /> : null;
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
        {c.turnaround && (
          <p style={{ marginTop: "1.2rem" }}>
            <strong>Turnaround:</strong> {c.turnaround}
          </p>
        )}
      </section>

      {gallery.length > 0 && (
        <section aria-labelledby="gallery-h">
          <h2 id="gallery-h">Examples</h2>
          <div className="normal__gallery">
            {gallery.map((w) => (
              <figure key={w.id}>
                {}
                <img src={asset(w.image)} alt={w.title} loading="lazy" />
                <figcaption>{w.title}</figcaption>
              </figure>
            ))}
          </div>
          <p style={{ fontSize: "0.9rem" }}>
            More work in the <Link href="/art">full gallery</Link>.
          </p>
        </section>
      )}

      <section id="process" aria-labelledby="process-h">
        <h2 id="process-h">Process</h2>
        <ol>
          {c.process.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </section>

      <section id="terms" aria-labelledby="terms-h">
        <h2 id="terms-h">Terms</h2>
        <ul>
          {c.terms.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      {c.faq.length > 0 && (
        <section aria-labelledby="faq-h">
          <h2 id="faq-h">FAQ</h2>
          {c.faq.map((f) => (
            <details key={f.id}>
              <summary>{f.q}</summary>
              <RichText text={f.a} />
            </details>
          ))}
        </section>
      )}

      <section id="contact" aria-labelledby="contact-h">
        <h2 id="contact-h">Contact</h2>
        <div className="normal__contact">
          <span>{c.contact.method}</span>
          <strong>{c.contact.value}</strong>
          {c.contact.note && <span style={{ fontSize: "0.9rem", color: "#55605f" }}>{c.contact.note}</span>}
        </div>
      </section>

      <footer className="normal__footer">
        <span>
          © {new Date().getFullYear()} {content.identity.name}
        </span>
        <ul className="normal__socials">
          {content.socials.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
