"use client";

import Link from "next/link";
import { useState } from "react";
import type { BioLayer } from "@/content/schema";
import { useContent, useStrings } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { RichText } from "@/lib/richtext";
import { playSound } from "@/lib/sound";
import { GlitchText } from "@/components/chaos/Glitch";
import { asset } from "@/lib/asset";

function Stars({ n }: { n: number }) {
  return (
    <span className="interest__stars" aria-label={`${n} out of 5`}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}

function InterestCard({ id }: { id: string }) {
  const content = useContent();
  const depth = useVisitor((s) => s.depth);
  const [open, setOpen] = useState(false);
  const it = content.interests.find((i) => i.id === id);
  if (!it) return null;
  const showHidden = depth >= 2 && it.hiddenContent;
  return (
    <button
      type="button"
      className="interest"
      style={{ "--r": `${((id.charCodeAt(1) || 0) % 5) - 2}deg` } as React.CSSProperties}
      onClick={() => {
        setOpen((o) => !o);
        playSound("click");
      }}
      aria-expanded={open}
    >
      {}
      {it.image && <img src={asset(it.image)} alt="" loading="lazy" />}
      <div className="interest__title">{it.title}</div>
      <Stars n={it.rating} />
      {open && <p style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>{it.description}</p>}
      {open && showHidden && <div className="interest__hidden">{it.hiddenContent}</div>}
      {open && it.tags.length > 0 && <div className="mono tiny" style={{ marginTop: "0.3rem" }}>{it.tags.map((t) => `#${t}`).join(" ")}</div>}
    </button>
  );
}

function KindBlock({ kind }: { kind: BioLayer["kind"] }) {
  const content = useContent();
  const depth = useVisitor((s) => s.depth);
  switch (kind) {
    case "personality":
      return (
        <p>
          <Link href="/about/personality" className="btn btn--accent" style={{ "--r": "-1deg" } as React.CSSProperties}>
            enter the personality room →
          </Link>
        </p>
      );
    case "likes":
    case "interests":
      return (
        <div className="interest-grid">
          {content.interests.map((i) => (
            <InterestCard key={i.id} id={i.id} />
          ))}
        </div>
      );
    case "dislikes":
      return (
        <ul className="hand" style={{ fontSize: "1.3rem" }}>
          {content.dislikes.map((d) => (
            <li key={d.id}>
              {d.text}
              {d.reason && <span className="mono tiny"> {d.reason}</span>}
            </li>
          ))}
        </ul>
      );
    case "facts":
      return (
        <ul className="mono" style={{ fontSize: "0.9rem" }}>
          {content.facts
            .filter((f) => f.minDepth <= depth)
            .map((f) => (
              <li key={f.id}>{f.text}</li>
            ))}
          {content.facts.some((f) => f.minDepth > depth) && <li style={{ opacity: 0.4 }}>[{content.facts.filter((f) => f.minDepth > depth).length} more, further down]</li>}
        </ul>
      );
    case "thoughts":
      return (
        <ul className="serif" style={{ fontSize: "1.15rem", fontStyle: "italic" }}>
          {content.thoughts
            .filter((f) => f.minDepth <= depth)
            .map((f) => (
              <li key={f.id}>{f.text}</li>
            ))}
        </ul>
      );
    default:
      return null;
  }
}

function Layer({ layer, level, isLast }: { layer: BioLayer; level: number; isLast: boolean }) {
  const depth = useVisitor((s) => s.depth);
  const addDepth = useVisitor((s) => s.addDepth);
  const setFlag = useVisitor((s) => s.setFlag);
  const opened = useVisitor((s) => !!s.flags[`bio:${layer.id}`]);
  const [open, setOpen] = useState(false);
  const children = layer.children ?? [];
  const locked = (layer.minDepth ?? 0) > depth;
  const deep = level >= 6;

  const openNext = () => {
    setOpen(true);
    playSound(level >= 5 ? "glitch" : "pop");
    if (!opened) {
      setFlag(`bio:${layer.id}`, true);
      if (layer.depthGain) addDepth(layer.depthGain);
    }
  };

  return (
    <>
      <section className="layer" data-deep={deep ? "true" : undefined} aria-labelledby={`layer-${layer.id}`}>
        <h2 className="layer__title" id={`layer-${layer.id}`}>
          {level >= 4 ? <GlitchText text={layer.title || "…"} /> : layer.title}
        </h2>
        <RichText text={layer.body} />
        <KindBlock kind={layer.kind} />
        {children.length > 0 && !open && !locked && (
          <p className="layer__open">
            <button type="button" className={`btn ${level >= 5 ? "btn--pixel" : level >= 2 ? "btn--hand" : ""}`} onClick={openNext}>
              {layer.prompt ?? "more"}
            </button>
          </p>
        )}
        {children.length > 0 && locked && (
          <p className="layer__locked">[this part of the page is not ready for you yet. explore elsewhere and come back.]</p>
        )}
        {isLast && children.length === 0 && (
          <p className="mono tiny" style={{ marginTop: "1rem", opacity: 0.6 }}>
            end of page. <Link href="/door">or not.</Link>
          </p>
        )}
      </section>
      {open && children.length > 0 && (
        <>
          <div className="layer__arrow" aria-hidden="true">
            ↓
          </div>
          {children.map((c, i) => (
            <Layer key={c.id} layer={c} level={level + 1} isLast={i === children.length - 1} />
          ))}
        </>
      )}
    </>
  );
}

export function AboutExplorer() {
  const content = useContent();
  const t = useStrings();
  return (
    <div className="page">
      <h1 className="huge hand" style={{ fontWeight: 400 }}>
        {t("about.title", "about")}
      </h1>
      <div className="about__stack">
        {content.bio.layers.map((l, i) => (
          <Layer key={l.id} layer={l} level={0} isLast={i === content.bio.layers.length - 1} />
        ))}
      </div>
    </div>
  );
}
