"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Artwork } from "@/content/schema";
import { useContent, useStrings } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { playSound } from "@/lib/sound";
import { seeded, useIsMobile } from "@/lib/utils";
import { RichText } from "@/lib/richtext";
import { asset } from "@/lib/asset";
import { Portal } from "@/components/chaos/Portal";

type Mode = "grid" | "pile" | "wall";

function useArtworkSecret(art: Artwork) {
  const flags = useVisitor((s) => s.flags);
  const setFlag = useVisitor((s) => s.setFlag);
  const addDepth = useVisitor((s) => s.addDepth);
  const pushMessage = useVisitor((s) => s.pushMessage);
  const key = `art:${art.id}`;
  const triggered = !!flags[key];
  const [clicks, setClicks] = useState(0);

  const trigger = () => {
    if (triggered || art.hidden.type === "none") return;
    setFlag(key, true);
    if (art.hidden.depthGain) addDepth(art.hidden.depthGain);
    pushMessage(art.hidden.text || "something changed", "whisper", 4000);
    playSound("glitch");
  };

  const click = () => {
    if (art.hidden.type === "none" || triggered) return;
    const n = clicks + 1;
    setClicks(n);
    if (n >= art.hidden.clicks) trigger();
  };

  return { triggered, click, trigger, clicks };
}

function ArtCard({ art, mode, index, onOpen }: { art: Artwork; mode: Mode; index: number; onOpen: () => void }) {
  const { triggered, click } = useArtworkSecret(art);
  const hoverTimer = useRef<number | null>(null);
  const secretRef = useRef<() => void>(() => {});
  const secret = useArtworkSecretTrigger(art);
  secretRef.current = secret;
  const src = triggered && art.hidden.type === "alt-image" && art.hidden.image ? art.hidden.image : art.image;
  const r = (seeded(art.id + "r") - 0.5) * 6;
  const pileStyle: React.CSSProperties =
    mode === "pile"
      ? {
          left: `${8 + seeded(art.id + "x") * 55}%`,
          top: `${5 + seeded(art.id + "y") * 55}%`,
          "--r": `${(seeded(art.id + "rr") - 0.5) * 30}deg`,
          zIndex: index,
        } as React.CSSProperties
      : ({ "--r": `${r}deg` } as React.CSSProperties);

  return (
    <button
      type="button"
      className="artcard"
      style={pileStyle}
      onClick={() => {
        click();
        playSound("click");
        onOpen();
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "touch" || art.hidden.type !== "alt-image") return;
        hoverTimer.current = window.setTimeout(() => secretRef.current(), 4000);
      }}
      onPointerLeave={() => {
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      }}
      aria-label={`${art.title}. open viewer`}
    >
      {}
      <img src={asset(src)} alt={art.title} loading="lazy" />
      {mode !== "wall" && (
        <>
          <h3 className="artcard__title">{art.title}</h3>
          <div className="artcard__meta">
            {art.category} · {art.date}
          </div>
        </>
      )}
      {art.commissionStatus === "commission" && <span className="artcard__badge">commission</span>}
      {triggered && <span className="artcard__badge" style={{ background: "var(--accent2)" }}>changed</span>}
    </button>
  );
}

function useArtworkSecretTrigger(art: Artwork) {
  const { trigger } = useArtworkSecret(art);
  return trigger;
}

function Viewer({ art, onClose, onPrev, onNext }: { art: Artwork; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const { triggered, click, clicks } = useArtworkSecret(art);
  const closeRef = useRef<HTMLButtonElement>(null);
  const src = triggered && art.hidden.type === "alt-image" && art.hidden.image ? art.hidden.image : art.image;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <Portal>
    <div className="viewer" role="dialog" aria-modal="true" aria-label={art.title} onClick={onClose}>
      <div className="viewer__box" onClick={(e) => e.stopPropagation()}>
        {}
        <img src={asset(src)} alt={art.title} onClick={click} style={{ cursor: art.hidden.type !== "none" && !triggered ? "help" : undefined }} />
        <div className="viewer__side">
          <button ref={closeRef} type="button" className="btn viewer__close" onClick={onClose} aria-label="close viewer">
            ×
          </button>
          <h2 className="hand" style={{ fontSize: "2rem", fontWeight: 400 }}>
            {art.title}
          </h2>
          <p className="mono tiny">
            {art.category} · {art.date} · {art.commissionStatus}
          </p>
          <RichText text={art.description} />
          {art.tags.length > 0 && <p className="mono tiny">{art.tags.map((t) => `#${t}`).join(" ")}</p>}
          {triggered && art.hidden.type === "text" && <div className="viewer__hidden">{art.hidden.text}</div>}
          {triggered && art.hidden.type === "link" && art.hidden.href && (
            <div className="viewer__hidden">
              {art.hidden.text} <Link href={art.hidden.href}>→</Link>
            </div>
          )}
          {!triggered && art.hidden.type !== "none" && clicks > 0 && (
            <p className="mono tiny" style={{ opacity: 0.5 }}>
              {".".repeat(clicks)}
            </p>
          )}
          <div className="game__actions">
            <button type="button" className="btn btn--ghost" onClick={onPrev} aria-label="previous artwork">
              ←
            </button>
            <button type="button" className="btn btn--ghost" onClick={onNext} aria-label="next artwork">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  );
}

export function Gallery() {
  const content = useContent();
  const t = useStrings();
  const depth = useVisitor((s) => s.depth);
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("grid");
  const [category, setCategory] = useState<string>("all");
  const [tag, setTag] = useState<string>("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const works = useMemo(() => {
    let list = content.art.works;
    if (category !== "all") list = list.filter((w) => w.category === category);
    if (tag) list = list.filter((w) => w.tags.includes(tag));
    if (depth >= 3) list = [...list].reverse();
    return list;
  }, [content.art.works, category, tag, depth]);

  const tags = useMemo(() => Array.from(new Set(content.art.works.flatMap((w) => w.tags))).slice(0, 12), [content.art.works]);
  const effectiveMode: Mode = isMobile && mode === "pile" ? "grid" : mode;

  return (
    <div className="page">
      <h1 className="huge display">{depth >= 4 ? "evidence" : t("art.title", "art")}</h1>
      {content.art.intro && <RichText text={content.art.intro} className="hand" />}

      <div className="art__toolbar" role="toolbar" aria-label="gallery filters">
        <button type="button" className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
          all
        </button>
        {content.art.categories.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
        <span aria-hidden="true" style={{ opacity: 0.4 }}>
          |
        </span>
        {tags.map((tg) => (
          <button key={tg} type="button" className="chip" aria-pressed={tag === tg} onClick={() => setTag(tag === tg ? "" : tg)}>
            #{tg}
          </button>
        ))}
        <span aria-hidden="true" style={{ opacity: 0.4 }}>
          |
        </span>
        {(["grid", "pile", "wall"] as Mode[]).map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={mode === m} onClick={() => setMode(m)} disabled={isMobile && m === "pile"}>
            {m}
          </button>
        ))}
      </div>

      <div className={`gallery gallery--${effectiveMode}`}>
        {works.map((w, i) => (
          <ArtCard key={w.id} art={w} mode={effectiveMode} index={i} onOpen={() => setOpenIndex(i)} />
        ))}
        {works.length === 0 && <p className="mono">nothing here (yet).</p>}
      </div>

      {openIndex !== null && works[openIndex] && (
        <Viewer
          art={works[openIndex]}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i === null ? null : (i - 1 + works.length) % works.length))}
          onNext={() => setOpenIndex((i) => (i === null ? null : (i + 1) % works.length))}
        />
      )}

      <p className="mono tiny" style={{ marginTop: "3rem", opacity: 0.6 }}>
        want one? <Link href="/commissions">commissions are over here</Link>. that page is normal. promise.
      </p>
    </div>
  );
}
