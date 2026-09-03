"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";
import { playSound } from "@/lib/sound";

export function ImpossibleButton({ settings, mood, report }: GameProps) {
  const { label, fleeDistance, catchableAfter } = settings.impossible;
  const arena = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [dodges, setDodges] = useState(0);
  const [caught, setCaught] = useState(false);
  const dodgesRef = useRef(0);
  const caughtRef = useRef(false);
  const lastMove = useRef(0);

  useEffect(
    () => () => {
      if (dodgesRef.current >= 10 && !caughtRef.current) report("loss");
    },
    [report],
  );

  const tired = dodges >= catchableAfter;
  const flee = mood === "transformed" ? fleeDistance * 1.4 : fleeDistance;

  const dodge = (px: number, py: number) => {
    const el = arena.current;
    if (!el || caught) return;
    const now = performance.now();
    if (now - lastMove.current < (tired ? 420 : 60)) return;
    lastMove.current = now;
    const r = el.getBoundingClientRect();
    const bx = r.left + (pos.x / 100) * r.width;
    const by = r.top + (pos.y / 100) * r.height;
    const dx = bx - px;
    const dy = by - py;
    const dist = Math.hypot(dx, dy);
    if (dist > flee) return;
    const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
    const step = tired ? 12 : 28;
    const nx = Math.max(8, Math.min(92, pos.x + Math.cos(ang) * step));
    const ny = Math.max(10, Math.min(90, pos.y + Math.sin(ang) * step));
    setPos({ x: nx, y: ny });
    setDodges((d) => {
      dodgesRef.current = d + 1;
      return d + 1;
    });
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    dodge(e.clientX, e.clientY);
  };

  const onArenaTap = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    if ((e.target as HTMLElement).closest("button")) return;
    setPos({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
    setDodges((d) => {
      dodgesRef.current = d + 1;
      return d + 1;
    });
    playSound("blip");
  };

  const catchIt = () => {
    if (caught) return;
    setCaught(true);
    caughtRef.current = true;
    playSound("win");
    report("win");
  };

  const text = caught ? "ok. you win." : tired ? "tired" : dodges > catchableAfter / 2 ? (mood === "normal" ? "no" : "why") : label;

  return (
    <div>
      <p className="game__status">
        {caught ? "caught." : `dodged ${dodges} time${dodges === 1 ? "" : "s"}`}
        {tired && !caught && <span className="mono tiny"> · it's slowing down</span>}
      </p>
      <div ref={arena} className="game__arena" style={{ minHeight: 320 }} onPointerMove={onMove} onPointerDown={onArenaTap}>
        <button
          type="button"
          className="btn btn--accent impossible"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", transition: tired ? "left 400ms ease, top 400ms ease" : undefined }}
          onClick={catchIt}
          onFocus={() => {
            if (!tired) setPos({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
          }}
        >
          {text}
        </button>
      </div>
      <p className="mono tiny" style={{ marginTop: "0.6rem", opacity: 0.6 }}>
        it gets tired after {catchableAfter} dodges. keyboard: tab to it until it&apos;s tired, then enter.
      </p>
    </div>
  );
}
