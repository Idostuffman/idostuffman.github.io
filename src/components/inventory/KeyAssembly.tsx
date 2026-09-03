"use client";

import { useEffect, useState } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { collectItemById, CODE_ALPHABET } from "@/lib/progression";
import { Portal } from "@/components/chaos/Portal";
import { playSound } from "@/lib/sound";

const GLYPHS = "▒░▓█◈◇◆∆⌐¬§¤" + CODE_ALPHABET;

export function KeyAssembly({ onDone }: { onDone: () => void }) {
  const content = useContent();
  const code = useVisitor((s) => s.run.code) ?? "";
  const revealCode = useVisitor((s) => s.revealCode);
  const fragments = content.progression.fragments.filter((f) => useVisitor.getState().run.fragments.includes(f.id));
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<"gather" | "churn" | "settled">("gather");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("churn"), 1400);
    let settled = 0;
    let churn = 0;
    const t2 = window.setTimeout(() => {
      churn = window.setInterval(() => {
        let out = "";
        for (let i = 0; i < code.length; i++) {
          if (code[i] === "-") out += "-";
          else if (i < settled) out += code[i];
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setShown(out);
      }, 60);
      const settle = window.setInterval(() => {
        settled += 1;
        if (settled % 3 === 0) playSound("blip");
        if (settled >= code.length) {
          window.clearInterval(settle);
          window.clearInterval(churn);
          setShown(code);
          setPhase("settled");
          playSound("hum");
        }
      }, 420);
    }, 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearInterval(churn);
    };
  }, [code]);

  const keep = () => {
    revealCode();
    collectItemById(content, "torn-note");
    playSound("pop");
    onDone();
  };

  return (
    <Portal>
      <div className="assembly" role="dialog" aria-modal="true" aria-label="the key">
        <div className={`assembly__pieces assembly__pieces--${phase}`} aria-hidden="true">
          {fragments.map((f, i) => (
            <span key={f.id} className="assembly__piece pixel" style={{ "--i": i, "--n": fragments.length } as React.CSSProperties}>
              {String.fromCharCode(0x2596 + (i % 8))}
            </span>
          ))}
        </div>
        <p className="assembly__code mono" aria-live="polite">
          {phase === "gather" ? "" : shown}
        </p>
        {phase === "settled" && (
          <>
            <p className="assembly__back hand">{content.progression.messages.noteBack}</p>
            <button type="button" className="btn btn--pixel" onClick={keep}>
              keep it
            </button>
          </>
        )}
      </div>
    </Portal>
  );
}
