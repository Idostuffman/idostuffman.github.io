"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sound";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  closable?: boolean;
  onClose?: () => void;
  floating?: { x: number; y: number };
  width?: number | string;
};

export function DraggableWindow({ title, children, className, style, closable, onClose, floating, width }: Props) {
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [closed, setClosed] = useState(false);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [lifted, setLifted] = useState(false);

  if (closed) return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset?.x ?? 0, oy: offset?.y ?? 0 };
    setLifted(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const positional: React.CSSProperties = floating
    ? { position: "absolute", left: `${floating.x}%`, top: `${floating.y}%` }
    : {};

  return (
    <div
      className={cn("window", lifted && "window--lifted", className)}
      style={{
        ...positional,
        width,
        transform: offset ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
        zIndex: lifted ? 5 : undefined,
        ...style,
      }}
      role="group"
      aria-label={title}
    >
      <div
        className="window__bar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          className="window__dot"
          aria-label={closable ? `close ${title}` : "this button is decorative"}
          onClick={() => {
            playSound("click");
            if (closable) {
              setClosed(true);
              onClose?.();
            }
          }}
        />
        <span className="title">{title}</span>
        <span className="window__dot" aria-hidden="true" style={{ background: "var(--accent2)" }} />
      </div>
      <div className="window__body">{children}</div>
    </div>
  );
}
