"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { RealEyeLayer } from "@/components/chaos/RealEyeLayer";
import { useReducedMotion } from "@/lib/utils";

export function BasementShell({ children }: { children: React.ReactNode }) {
  const content = useContent();
  const router = useRouter();
  const pathname = usePathname() ?? "/basement";
  const hydrated = useVisitor((s) => s.hydrated);
  const unlocked = useVisitor((s) => s.run.basementUnlocked);
  const level = useVisitor((s) => Math.max(1, s.run.basementLevel));
  const depth = useVisitor((s) => s.depth);
  const setDepth = useVisitor((s) => s.setDepth);
  const roomsVisited = useVisitor((s) => s.run.roomsVisited.length);
  const reduced = useReducedMotion();
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!unlocked) {
      router.replace("/door");
      return;
    }
    const want = level >= 2 ? 9 : 8;
    if (depth < want) setDepth(want);
  }, [hydrated, unlocked, level, depth, setDepth, router]);

  useEffect(() => {
    document.documentElement.dataset.basement = String(Math.min(3, level));
    const title = content.basement.title || "…";
    document.title = title;
    const observer = new MutationObserver(() => {
      if (document.title !== title) document.title = title;
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.basement;
    };
  }, [level, content.basement.title, pathname]);

  useEffect(() => {
    if (reduced) return;
    let tx = 50;
    let ty = 40;
    let x = 50;
    let y = 40;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
    };
    const id = window.setInterval(() => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      lightRef.current?.style.setProperty("--lx", `${x}%`);
      lightRef.current?.style.setProperty("--ly", `${y}%`);
    }, 40);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  if (!hydrated || !unlocked) {
    return <div className="basement basement--empty" aria-busy="true" />;
  }

  const eyeLevel = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;

  return (
    <div className="basement" data-level={level}>
      <div ref={lightRef} className="basement__light" aria-hidden="true" />
      <div className="basement__grain" aria-hidden="true" style={{ opacity: content.basement.noise }} />
      {children}
      <RealEyeLayer level={eyeLevel} config={content.basement.eyes} boost={Math.min(8, roomsVisited)} />
    </div>
  );
}
