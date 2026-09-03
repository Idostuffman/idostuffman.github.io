"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useContent } from "@/content/ContentProvider";
import { useVisitor, configurePersistence } from "@/state/visitorStore";
import { setSoundEnabled } from "@/lib/sound";
import { fireInteraction, type ActionContext } from "./engine";
import { on } from "./events";

export function InteractionProvider({ children }: { children: React.ReactNode }) {
  const content = useContent();
  const router = useRouter();
  const pathname = usePathname();
  const ctxRef = useRef<ActionContext>({ content, navigate: (to) => router.push(to) });
  ctxRef.current = { content, navigate: (to) => router.push(to) };

  const interactions = content.interactions;
  const hydrated = useVisitor((s) => s.hydrated);

  useLayoutEffect(() => {
    configurePersistence({ progress: content.settings.persistProgress });
    void useVisitor.persist.rehydrate();
    const s = useVisitor.getState();
    if (s.depth < content.settings.startDepth) s.setDepth(content.settings.startDepth);
  }, []);

  const lastCounted = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname || !hydrated) return;
    if (lastCounted.current === pathname) return;
    lastCounted.current = pathname;
    const s = useVisitor.getState();
    const n = s.visit(pathname);
    for (const it of interactions) {
      if (it.trigger.type === "visit" && it.trigger.target === pathname) fireInteraction(it, ctxRef.current);
      if (it.trigger.type === "visits" && it.trigger.target === pathname && n >= it.trigger.count) {
        fireInteraction({ ...it, trigger: { ...it.trigger, count: 1 } }, ctxRef.current);
      }
    }
  }, [pathname, interactions, hydrated]);

  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-24);
      for (const it of interactions) {
        if (it.trigger.type !== "keys" || !it.trigger.target) continue;
        if (buffer.endsWith(it.trigger.target.toLowerCase())) {
          if (fireInteraction(it, ctxRef.current)) buffer = "";
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactions]);

  useEffect(() => {
    const check = (depth: number) => {
      for (const it of interactions) {
        if (it.trigger.type !== "depth") continue;
        const needed = Number(it.trigger.target);
        if (Number.isFinite(needed) && depth >= needed) {
          fireInteraction({ ...it, trigger: { ...it.trigger, count: 1 } }, ctxRef.current);
        }
      }
    };
    check(useVisitor.getState().depth);
    return useVisitor.subscribe((s, prev) => {
      if (s.depth !== prev.depth) check(s.depth);
    });
  }, [interactions]);

  useEffect(
    () =>
      on("game:result", ({ totalLosses }) => {
        for (const it of interactions) {
          if (it.trigger.type !== "gameloss") continue;
          const needed = Number(it.trigger.target);
          if (Number.isFinite(needed) && totalLosses >= needed) {
            fireInteraction({ ...it, trigger: { ...it.trigger, count: 1 } }, ctxRef.current);
          }
        }
      }),
    [interactions],
  );

  useEffect(() => {
    const scrollTriggers = interactions.filter((i) => i.trigger.type === "scroll");
    if (!scrollTriggers.length) return;
    let timer: number | null = null;
    const check = () => {
      timer = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max < 200) return;
      const frac = window.scrollY / max;
      for (const it of scrollTriggers) {
        const needed = Number(it.trigger.target);
        if (Number.isFinite(needed) && frac >= needed) {
          fireInteraction({ ...it, trigger: { ...it.trigger, count: 1 } }, ctxRef.current);
        }
      }
    };
    const onScroll = () => {
      if (timer !== null) return;
      timer = window.setTimeout(check, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [interactions, pathname]);

  useEffect(() => {
    const idleTriggers = interactions.filter((i) => i.trigger.type === "idle");
    if (!idleTriggers.length) return;
    const timers: number[] = [];
    const arm = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
      for (const it of idleTriggers) {
        const secs = Number(it.trigger.target);
        if (!Number.isFinite(secs)) continue;
        timers.push(
          window.setTimeout(() => fireInteraction({ ...it, trigger: { ...it.trigger, count: 1 } }, ctxRef.current), secs * 1000),
        );
      }
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [interactions]);

  const depth = useVisitor((s) => s.depth);
  const glitchUntil = useVisitor((s) => s.glitchUntil);
  const soundEnabled = useVisitor((s) => s.soundEnabled);
  const isNormal = pathname?.startsWith("/commissions") || pathname?.startsWith("/admin");

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.depth = String(isNormal ? 0 : depth);
    if (pathname?.startsWith("/basement") || pathname?.startsWith("/door")) return;
    const level = content.deepLevels.find((l) => l.depth === depth);
    const title = pathname?.startsWith("/admin")
      ? `Editor — ${content.identity.name}`
      : isNormal
        ? `${content.commissions.headline} — ${content.identity.name}`
        : level?.title || (depth >= 3 ? content.identity.deepTitle : content.identity.siteTitle);
    document.title = title;
    const observer = new MutationObserver(() => {
      if (document.title !== title) document.title = title;
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [depth, isNormal, pathname, content, hydrated]);

  useEffect(() => {
    const remaining = glitchUntil - Date.now();
    if (remaining <= 0) return;
    document.body.dataset.glitching = "true";
    const t = window.setTimeout(() => {
      delete document.body.dataset.glitching;
    }, remaining);
    return () => window.clearTimeout(t);
  }, [glitchUntil]);

  useEffect(() => setSoundEnabled(soundEnabled), [soundEnabled]);

  return <>{children}</>;
}
