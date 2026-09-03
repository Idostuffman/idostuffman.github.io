"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { RealEye } from "./RealEye";
import { Portal } from "./Portal";

export function Confrontation() {
  const content = useContent();
  const confrontUntil = useVisitor((s) => s.confrontUntil);
  const dismiss = useVisitor((s) => s.dismissConfront);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const active = confrontUntil > 0;

  useEffect(() => {
    const remaining = confrontUntil - Date.now();
    if (remaining <= 0) return;
    const t = window.setTimeout(dismiss, remaining);
    return () => window.clearTimeout(t);
  }, [confrontUntil, dismiss]);

  useEffect(() => {
    if (!active) return;
    const onMove = (e: PointerEvent) => {
      for (const ref of [leftRef, rightRef]) {
        const el = ref.current;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, dist / 500);
        el.style.setProperty("--gx", ((dx / dist) * k).toFixed(2));
        el.style.setProperty("--gy", ((dy / dist) * k).toFixed(2));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, dismiss]);

  if (!active) return null;

  return (
    <Portal>
      <div className="confront" role="alertdialog" aria-modal="true" onClick={dismiss}>
        <div className="confront__eyes">
          <div className="confront__eye" ref={leftRef}>
            <RealEye size={220} blinkEvery={0} halo={false} />
          </div>
          <div className="confront__eye" ref={rightRef}>
            <RealEye size={220} blinkEvery={0} halo={false} />
          </div>
        </div>
        <p className="confront__text huge pixel">{content.confrontation.text}</p>
        <p className="confront__hint mono tiny">click, or press escape, to leave</p>
      </div>
    </Portal>
  );
}
