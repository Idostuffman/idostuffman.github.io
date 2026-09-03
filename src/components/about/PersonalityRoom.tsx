"use client";

import Link from "next/link";
import { useState } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { RichText } from "@/lib/richtext";
import { playSound } from "@/lib/sound";
import { GlitchText } from "@/components/chaos/Glitch";
import { RealEye } from "@/components/chaos/RealEye";

export function PersonalityRoom() {
  const content = useContent();
  const depth = useVisitor((s) => s.depth);
  const addDepth = useVisitor((s) => s.addDepth);
  const flags = useVisitor((s) => s.flags);
  const setFlag = useVisitor((s) => s.setFlag);
  const [peeled, setPeeled] = useState(1);
  const layers = content.personality.layers;
  const traits = content.personality.traits.filter((t) => !t.hidden || depth >= 3);
  const hiddenCount = content.personality.traits.filter((t) => t.hidden).length - traits.filter((t) => t.hidden).length;

  const peel = () => {
    const next = peeled + 1;
    setPeeled(next);
    playSound(next >= 4 ? "glitch" : "pop");
    const key = `onion:${next}`;
    if (!flags[key]) {
      setFlag(key, true);
      if (next >= 3) addDepth(1);
    }
  };

  return (
    <div className="page page--narrow">
      <p className="mono tiny">
        <Link href="/about">← back up the stairs</Link>
      </p>
      <h1 className="huge display">personality</h1>
      <RichText text={content.personality.intro} />

      <section aria-labelledby="traits">
        <h2 id="traits" className="hand" style={{ fontSize: "2rem" }}>
          traits
        </h2>
        {traits.map((t) => (
          <div key={t.id} className={`trait ${t.hidden ? "trait--hidden" : ""}`}>
            <span className="trait__name">{t.trait}</span>
            <span className="trait__meter" aria-label={`intensity ${t.intensity} of 5`}>
              {"█".repeat(t.intensity)}
              {"░".repeat(5 - t.intensity)}
            </span>
            <p className="trait__desc">{t.description}</p>
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="mono tiny" style={{ opacity: 0.5, marginTop: "0.6rem" }}>
            [{hiddenCount} trait{hiddenCount > 1 ? "s" : ""} not shown]
          </p>
        )}
      </section>

      <section aria-labelledby="onion" style={{ marginTop: "2.5rem" }}>
        <h2 id="onion" className="hand" style={{ fontSize: "2rem" }}>
          layers
        </h2>
        <div className="onion">
          {layers.slice(0, peeled).map((l, i) => (
            <div key={l.id} className="onion__layer" data-level={Math.min(5, i)}>
              <h3 className="onion__title">{i >= 3 ? <GlitchText text={l.title || "…"} /> : l.title || "…"}</h3>
              <RichText text={l.body} />
              {i === layers.length - 1 && depth >= 4 && <RealEye size={110} style={{ marginTop: "1rem" }} />}
            </div>
          ))}
        </div>
        {peeled < layers.length ? (
          <p style={{ marginTop: "1rem" }}>
            <button type="button" className={`btn ${peeled >= 3 ? "btn--pixel" : "btn--hand"}`} onClick={peel}>
              {peeled === 1 ? "peel" : peeled === 2 ? "peel again" : peeled === 3 ? "keep peeling" : peeled === 4 ? "there's more?" : "..."}
            </button>
          </p>
        ) : (
          <p className="mono tiny" style={{ marginTop: "1rem", opacity: 0.6 }}>
            no more layers. <Link href="/about">go back up</Link>, or <Link href="/games">go lose a game</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
