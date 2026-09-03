"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { fireInteraction, type ActionContext } from "./engine";

const HOVER_DWELL_MS = 3000;
const TOUCH_HOLD_MS = 1200;
const LONGPRESS_MS = 700;

export type TargetProps = {
  onClick: () => void;
  onDoubleClick: () => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: (e?: React.PointerEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e?: React.PointerEvent) => void;
  onPointerCancel: (e?: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function useInteractionTarget(targetId: string | undefined) {
  const content = useContent();
  const router = useRouter();
  const hoverTimer = useRef<number | null>(null);
  const pressTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const ctx = useMemo<ActionContext>(() => ({ content, navigate: (to) => router.push(to) }), [content, router]);

  const matching = useMemo(
    () => (targetId ? content.interactions.filter((i) => i.trigger.target === targetId) : []),
    [content.interactions, targetId],
  );

  const fire = useCallback(
    (type: string) => {
      for (const it of matching) if (it.trigger.type === type) fireInteraction(it, ctx);
    },
    [matching, ctx],
  );

  const clear = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = null;
  };

  const props = useMemo<Partial<TargetProps>>(() => {
    if (!matching.length) return {};
    const hasHover = matching.some((i) => i.trigger.type === "hover");
    const hasLong = matching.some((i) => i.trigger.type === "longpress");
    return {
      onClick: () => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        fire("click");
      },
      onDoubleClick: () => fire("dblclick"),
      onPointerEnter: (e: React.PointerEvent) => {
        if (!hasHover || e.pointerType === "touch") return;
        clear(hoverTimer);
        hoverTimer.current = window.setTimeout(() => fire("hover"), HOVER_DWELL_MS);
      },
      onPointerLeave: () => {
        clear(hoverTimer);
        clear(pressTimer);
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (!hasLong && !(hasHover && e.pointerType === "touch")) return;
        clear(pressTimer);
        const ms = e.pointerType === "touch" && hasHover && !hasLong ? TOUCH_HOLD_MS : LONGPRESS_MS;
        pressTimer.current = window.setTimeout(() => {
          suppressClick.current = true;
          if (hasLong) fire("longpress");
          if (hasHover && e.pointerType === "touch") fire("hover");
        }, ms);
      },
      onPointerUp: () => clear(pressTimer),
      onPointerCancel: () => clear(pressTimer),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          if (hasHover) fire("hover");
          if (hasLong) fire("longpress");
        }
      },
    };
  }, [matching, fire]);

  const count = useVisitor((s) => (matching[0] ? s.interactionCounts[matching[0].id] ?? 0 : 0));

  return { props, count, hasInteractions: matching.length > 0 };
}

export function useTargetState(id: string) {
  const revealed = useVisitor((s) => s.revealed.includes(id));
  const hidden = useVisitor((s) => s.hidden.includes(id));
  const text = useVisitor((s) => s.textOverrides[id]);
  const image = useVisitor((s) => s.imageOverrides[id]);
  return { revealed, hidden, text, image };
}
