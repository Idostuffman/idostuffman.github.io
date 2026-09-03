"use client";

import { useEffect, useRef, useState } from "react";
import { useVisitor } from "@/state/visitorStore";
import { useIsTouch, useReducedMotion } from "@/lib/utils";

const TRAIL = 6;
const HOVER_SELECTOR = "a, button, [role=button], input, textarea, select, summary, .sticker, .window__bar, .bg-word[data-live=true]";

export function CustomCursor() {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const depth = useVisitor((s) => s.depth);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState(false);

  const enabled = !isTouch && !reduced;

  useEffect(() => {
    document.documentElement.dataset.customCursor = enabled ? "true" : "false";
    return () => {
      document.documentElement.dataset.customCursor = "false";
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    if (!dot) return;

    const lag = depth >= 3 ? 0.18 : 0.35;
    const positions = Array.from({ length: TRAIL }, () => ({ x: -100, y: -100 }));
    let target = { x: -100, y: -100 };
    let raf = 0;
    let running = false;
    let shown = false;
    let hovering = false;

    const placeDot = () => {
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
    };

    const tick = () => {
      let prev = target;
      let settled = true;
      positions.forEach((p, i) => {
        p.x += (prev.x - p.x) * lag;
        p.y += (prev.y - p.y) * lag;
        if (Math.abs(prev.x - p.x) > 0.3 || Math.abs(prev.y - p.y) > 0.3) settled = false;
        const el = trailRefs.current[i];
        if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
        prev = p;
      });
      if (settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const startTrail = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target = { x: e.clientX, y: e.clientY };
      placeDot();
      if (!shown) {
        shown = true;
        setVisible(true);
      }
      const el = e.target as Element | null;
      const hov = !!(el && typeof el.closest === "function" && el.closest(HOVER_SELECTOR));
      if (hov !== hovering) {
        hovering = hov;
        dot.classList.toggle("cursor-dot--hover", hov);
      }
      startTrail();
    };

    const hide = () => {
      if (!shown) return;
      shown = false;
      setVisible(false);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
    };
  }, [enabled, depth]);

  if (!enabled) return null;

  return (
    <>
      {Array.from({ length: TRAIL }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="cursor-trail"
          style={{ opacity: visible ? 0.5 - i * 0.07 : 0, width: 6 - i * 0.6, height: 6 - i * 0.6 }}
          aria-hidden="true"
        />
      ))}
      <div ref={dotRef} className="cursor-dot" style={{ opacity: visible ? 1 : 0 }} aria-hidden="true" />
    </>
  );
}
