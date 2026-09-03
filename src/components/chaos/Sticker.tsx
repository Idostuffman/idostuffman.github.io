"use client";

import { useRef, useState } from "react";
import type { Sticker as StickerData } from "@/content/schema";
import { useInteractionTarget } from "@/interactions/useInteractionTarget";
import { useVisitor } from "@/state/visitorStore";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";

const DRAG_THRESHOLD = 6;

export function Sticker({ data, className }: { data: StickerData; className?: string }) {
  const { props: targetProps } = useInteractionTarget(data.target);
  const pushMessage = useVisitor((s) => s.pushMessage);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const elRef = useRef<HTMLButtonElement>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    targetProps.onPointerDown?.(e);
    if (!data.draggable) return;
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    start.current = { px: e.clientX, py: e.clientY, ox: rect.left, oy: rect.top, moved: false };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    s.moved = true;
    setDragging(true);
    setPos({ x: s.ox + dx + window.scrollX, y: s.oy + dy + window.scrollY });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    targetProps.onPointerUp?.(e);
    const moved = start.current?.moved;
    start.current = null;
    setDragging(false);
    if (moved) return;
    if (data.says) pushMessage(data.says, "note", 2200);
    playSound("click");
    targetProps.onClick?.();
  };

  const style: React.CSSProperties = pos
    ? { position: "absolute", left: pos.x, top: pos.y, transform: `rotate(${data.rotate}deg)` }
    : { position: "absolute", left: `${data.x}%`, top: `${data.y}%`, transform: `rotate(${data.rotate}deg)` };

  return (
    <button
      ref={elRef}
      type="button"
      className={cn("sticker", dragging && "sticker--dragging", data.hideOnMobile && "sticker--desktop-only", className)}
      style={{ ...style, fontSize: `${data.size}rem` }}
      aria-label={data.says ? `${data.content} — ${data.says}` : data.content}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        setDragging(false);
      }}
      onPointerEnter={targetProps.onPointerEnter}
      onPointerLeave={targetProps.onPointerLeave}
      onDoubleClick={targetProps.onDoubleClick}
      onKeyDown={(e) => {
        targetProps.onKeyDown?.(e);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (data.says) pushMessage(data.says, "note", 2200);
          targetProps.onClick?.();
        }
      }}
    >
      {data.image ? (
        <img src={asset(data.image)} alt="" draggable={false} style={{ width: `${data.size * 2.2}rem` }} />
      ) : (
        <span className={data.content.length > 4 ? "sticker__text" : undefined}>{data.content}</span>
      )}
    </button>
  );
}
