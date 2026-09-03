"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { unlockSecret } from "@/interactions/engine";
import { RichText } from "@/lib/richtext";
import { GlitchText } from "@/components/chaos/Glitch";
import { RealEye } from "@/components/chaos/RealEye";

export function SecretPage({ slug }: { slug: string }) {
  const content = useContent();
  const hydrated = useVisitor((s) => s.hydrated);
  const discovered = useVisitor((s) => s.discoveredSecrets);
  const eyeCount = useVisitor((s) => s.eyeCount);
  const secret = content.secrets.find((s) => s.slug === slug);
  const unlocked = !!secret && discovered.includes(secret.id);

  useEffect(() => {
    if (!hydrated || !secret || unlocked || !secret.urlUnlockable) return;
    unlockSecret(secret.id, content, useVisitor.getState());
  }, [hydrated, secret, unlocked, content]);

  if (!hydrated) return <div className="page" aria-busy="true" />;

  if (!secret) {
    return (
      <div className="page secret__locked">
        <p className="pixel" style={{ fontSize: "1.6rem" }}>
          there is no page here
        </p>
        <p className="tiny">(there might be, later)</p>
        <Link href="/">home</Link>
      </div>
    );
  }

  if (!unlocked && !secret.urlUnlockable) {
    return (
      <div className="page secret__locked">
        <p className="pixel" style={{ fontSize: "1.6rem" }}>
          this door is locked
        </p>
        <p className="tiny">you have not found the thing that opens it.</p>
        <Link href="/">go back</Link>
      </div>
    );
  }

  const body = secret.body.replace(/\[count\]/g, String(Math.max(eyeCount, 1)));
  const leads = secret.leadsTo.map((id) => content.secrets.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  const found = content.secrets.filter((s) => discovered.includes(s.id));

  return (
    <div className="page">
      <article className={`secret secret--${secret.style}`} aria-labelledby="secret-title">
        <h1 id="secret-title">{secret.style === "void" || secret.style === "terminal" ? <GlitchText text={secret.title} /> : secret.title}</h1>
        {secret.style === "void" && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <RealEye size={130} />
          </div>
        )}
        <RichText text={body} />
        {leads.length > 0 && (
          <div className="secret__leads" aria-label="this page leads to">
            {leads.map((l) => (
              <Link key={l.id} href={`/secrets/${l.slug}`}>
                {discovered.includes(l.id) ? l.title : "?".repeat(Math.max(3, l.title.length))}
              </Link>
            ))}
          </div>
        )}
      </article>
      <details style={{ maxWidth: 640, margin: "2rem auto" }}>
        <summary className="mono tiny">
          found so far: {found.length} / {content.secrets.length}
        </summary>
        <ul className="secret__list">
          {content.secrets.map((s) => (
            <li key={s.id}>{discovered.includes(s.id) ? <Link href={`/secrets/${s.slug}`}>{s.title}</Link> : "???"}</li>
          ))}
        </ul>
      </details>
      <p className="mono tiny" style={{ textAlign: "center" }}>
        <Link href="/">back to the surface</Link>
      </p>
    </div>
  );
}
