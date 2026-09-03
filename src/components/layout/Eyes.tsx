"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { useReducedMotion } from "@/lib/utils";
import { computeEyeCount, computeEyeTier, layoutEyes, type EyeSpec } from "@/lib/eyes";
import { Portal } from "@/components/chaos/Portal";

const STARE_AFTER_MS = 4000;
const STARTLE_MS = 350;

function EyeNode({ spec, register }: { spec: EyeSpec; register: (id: number, el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={(el) => register(spec.id, el)}
      className={`eye${spec.big ? " eye--big" : ""}${spec.shy ? " eye--shy" : ""}${spec.peek ? " eye--peek" : ""}`}
      style={{
        left: `${spec.x}%`,
        top: `${spec.y}%`,
        animationDelay: `${spec.delay}s, ${(spec.delay * 3.7) % 20}s`,
        animationDuration: `${spec.period}s, ${18 + spec.period * 2}s`,
      }}
      aria-hidden="true"
    >
      <div className="eye__pupil" />
    </div>
  );
}

export function Eyes({ extra = 0 }: { extra?: number }) {
  const roomExtra = useVisitor((s) => s.extraEyes);
  const content = useContent();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const hydrated = useVisitor((s) => s.hydrated);
  const depth = useVisitor((s) => s.depth);
  const eyeCount = useVisitor((s) => s.eyeCount);
  const eyesUnlocked = useVisitor((s) => s.eyesUnlocked);
  const secretsFound = useVisitor((s) => s.discoveredSecrets.length);
  const totalLosses = useVisitor((s) => s.totalLosses);

  const inputs = {
    depth,
    eyeCount,
    eyesUnlocked,
    secretsFound,
    totalLosses,
    transformThreshold: content.games.transformThreshold,
    extra: extra + roomExtra,
  };
  const total = hydrated ? computeEyeCount(inputs, content.eyes) : 0;
  const tier = computeEyeTier(inputs);
  const shyRadius = content.eyes.shyRadius;

  const specs = useMemo(() => layoutEyes(total, tier), [total, tier]);

  const layerRef = useRef<HTMLDivElement>(null);
  const behindRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const register = (id: number, el: HTMLDivElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  };

  useEffect(() => {
    if (!total || reduced) return;
    const rects = new Map<number, { cx: number; cy: number }>();
    let target: { x: number; y: number } | null = null;
    let lastTick = 0;
    let idleTimer: number | null = null;

    const measure = () => {
      rects.clear();
      nodes.current.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        rects.set(id, { cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
      });
    };

    const setLayerClass = (cls: string, on: boolean) => {
      layerRef.current?.classList.toggle(cls, on);
      behindRef.current?.classList.toggle(cls, on);
    };

    const tick = () => {
      if (!target) return;
      const t = target;
      nodes.current.forEach((el, id) => {
        let c = rects.get(id);
        if (!c) {
          const r = el.getBoundingClientRect();
          c = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
          rects.set(id, c);
        }
        const dx = t.x - c.cx;
        const dy = t.y - c.cy;
        const dist = Math.hypot(dx, dy) || 1;
        const spec = specs[id];
        if (spec?.shy) {
          el.classList.toggle("eye--hidden", dist < shyRadius);
        }
        if (tier === 0) return;
        const max = spec?.big ? 14 : 6;
        const k = Math.min(1, dist / 420) * max;
        const pupil = el.firstElementChild as HTMLElement | null;
        if (pupil) pupil.style.transform = `translate(${(dx / dist) * k}px, ${(dy / dist) * k}px)`;
      });
    };

    const onMove = (e: PointerEvent) => {
      target = { x: e.clientX, y: e.clientY };
      const now = performance.now();
      if (now - lastTick >= 16) {
        lastTick = now;
        tick();
      }
      if (tier >= 2) {
        setLayerClass("eyes-layer--stare", false);
        if (idleTimer) window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => setLayerClass("eyes-layer--stare", true), STARE_AFTER_MS);
      }
    };

    let startleTimer: number | null = null;
    const onDown = () => {
      if (tier < 2) return;
      setLayerClass("eyes-layer--startled", true);
      if (startleTimer) window.clearTimeout(startleTimer);
      startleTimer = window.setTimeout(() => setLayerClass("eyes-layer--startled", false), STARTLE_MS);
    };

    let blinkInterval: number | null = null;
    let blinkOff: number | null = null;
    if (tier === 3) {
      blinkInterval = window.setInterval(() => {
        setLayerClass("eyes-layer--blink", true);
        blinkOff = window.setTimeout(() => setLayerClass("eyes-layer--blink", false), 220);
      }, 14000 + Math.random() * 10000);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      if (idleTimer) window.clearTimeout(idleTimer);
      if (startleTimer) window.clearTimeout(startleTimer);
      if (blinkInterval) window.clearInterval(blinkInterval);
      if (blinkOff) window.clearTimeout(blinkOff);
    };
  }, [total, tier, reduced, specs, shyRadius]);

  if (!total) return null;

  const front = specs.filter((s) => !s.behind);
  const behind = specs.filter((s) => s.behind);
  const navKey = tier >= 2 ? pathname : "static";

  return (
    <Portal>
      {behind.length > 0 && (
        <div ref={behindRef} key={`b-${navKey}`} className="eyes-layer eyes-layer--behind" data-tier={tier} aria-hidden="true">
          {behind.map((s) => (
            <EyeNode key={s.id} spec={s} register={register} />
          ))}
        </div>
      )}
      <div ref={layerRef} key={`f-${navKey}`} className="eyes-layer" data-tier={tier} aria-hidden="true">
        {front.map((s) => (
          <EyeNode key={s.id} spec={s} register={register} />
        ))}
      </div>
    </Portal>
  );
}
