"use client";

import { useMemo } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { useInteractionTarget } from "@/interactions/useInteractionTarget";
import { seeded, useMounted } from "@/lib/utils";

function BgWord({ word, index, depth, live }: { word: string; index: number; depth: number; live: boolean }) {
  const targetId = live ? `bg-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : undefined;
  const { props } = useInteractionTarget(targetId);
  const seed = `${word}-${index}`;
  const x = seeded(seed + "x") * 100;
  const y = seeded(seed + "y") * 100;
  const rot = (seeded(seed + "r") - 0.5) * (20 + depth * 12);
  const variant = index % 5 === 0 ? "bg-word--small" : index % 3 === 0 ? "bg-word--hand" : "";
  const style: React.CSSProperties = {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
  };
  if (live) {
    return (
      <button type="button" className={`bg-word ${variant}`} style={style} data-live="true" {...props} aria-label={`${word} (something is behind this word)`}>
        {word}
      </button>
    );
  }
  return (
    <span className={`bg-word ${variant}`} style={style} aria-hidden="true">
      {word}
    </span>
  );
}

export function BackgroundText() {
  const content = useContent();
  const depth = useVisitor((s) => s.depth);
  const mounted = useMounted();

  const liveTargets = useMemo(
    () => new Set(content.interactions.filter((i) => i.trigger.target.startsWith("bg-")).map((i) => i.trigger.target)),
    [content.interactions],
  );

  const words = useMemo(() => {
    const levels = content.deepLevels.filter((l) => l.depth <= depth).sort((a, b) => b.depth - a.depth);
    const out: string[] = [];
    for (const l of levels) {
      for (const w of l.backgroundWords) if (out.length < 10 + depth * 3) out.push(w);
    }
    return out;
  }, [content.deepLevels, depth]);

  if (!mounted) return null;

  return (
    <div className="bg-text" aria-hidden={false}>
      {words.map((w, i) => {
        const id = `bg-${w.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        return <BgWord key={`${w}-${i}`} word={w} index={i} depth={depth} live={liveTargets.has(id)} />;
      })}
    </div>
  );
}
