"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";
import { useVisitor } from "@/state/visitorStore";
import { playSound } from "@/lib/sound";
import { useContent } from "@/content/ContentProvider";
import { checkRewards } from "@/lib/progression";

export function ClickerGame({ settings, mood, report }: GameProps) {
  const { milestones, moveAt, resetOnMiss } = settings.clicker;
  const content = useContent();
  const stored = useVisitor((s) => s.flags);
  const setFlag = useVisitor((s) => s.setFlag);
  const [count, setCount] = useState(0);
  const [note, setNote] = useState("");
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const countRef = useRef(0);
  const reportedRef = useRef(false);
  const posRef = useRef({ x: 50, y: 50 });

  const moving = count >= moveAt;

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(
    () => () => {
      if (countRef.current >= 30 && !reportedRef.current) report("loss");
    },
    [report],
  );

  const jump = (n: number) => {
    let next = posRef.current;
    if (n < moveAt) {
      const k = Math.min(1, n / moveAt) * 6;
      next = { x: 50 + (Math.random() - 0.5) * k, y: 50 + (Math.random() - 0.5) * k };
    } else {
      for (let tries = 0; tries < 8; tries++) {
        const candidate = { x: 16 + Math.random() * 68, y: 24 + Math.random() * 52 };
        if (Math.hypot(candidate.x - posRef.current.x, candidate.y - posRef.current.y) > 22 || tries === 7) {
          next = candidate;
          break;
        }
      }
    }
    posRef.current = next;
    setPos(next);
  };

  const restless = count >= moveAt + 100;
  useEffect(() => {
    if (!restless) return;
    const id = window.setInterval(() => jump(countRef.current), 1200);
    return () => window.clearInterval(id);
  }, [restless, moveAt]);

  const click = () => {
    const n = countRef.current + 1;
    countRef.current = n;
    setCount(n);
    checkRewards(content, "clicker", { clicks: n });
    playSound(n % 10 === 0 ? "pop" : "click");
    const m = milestones.find((ms) => ms.at === n);
    if (m) {
      setNote(m.text);
      if (!stored[`clicker:${n}`]) setFlag(`clicker:${n}`, true);
    } else if (n === moveAt) {
      setNote("it moved.");
    }
    if (n >= 60) jump(n);
    const last = milestones[milestones.length - 1];
    if (last && n === last.at && !reportedRef.current) {
      reportedRef.current = true;
      report("win");
    }
  };

  const miss = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".clicker__btn")) return;
    if (!resetOnMiss || countRef.current < moveAt) return;
    const lost = countRef.current;
    countRef.current = 0;
    setCount(0);
    posRef.current = { x: 50, y: 50 };
    setPos({ x: 50, y: 50 });
    setNote(`missed. it forgot all ${lost}.`);
    playSound("wrong");
    report("loss");
  };

  const warmth = Math.min(1, count / moveAt);
  const style: React.CSSProperties = {
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: `translate(-50%, -50%) rotate(${count > 120 ? (count % 7) - 3 : 0}deg)`,
    background: `color-mix(in srgb, var(--accent) ${100 - warmth * 60}%, #ff3b3b ${warmth * 60}%)`,
    borderRadius: count > 200 ? `${50 - (count % 40)}% ${50 + (count % 30)}% ${40 + (count % 20)}% ${60 - (count % 25)}%` : "50%",
  };

  const label = count === 0 ? "click" : count < 100 ? "again" : count < moveAt ? (mood === "normal" ? "again" : "keep going") : "…";

  return (
    <div className="clicker">
      <div className="clicker__count" aria-live="polite">
        {count}
      </div>
      <div
        className={`clicker__arena ${moving ? "clicker__arena--moving" : ""}`}
        onPointerDown={miss}
        aria-label={moving ? "the button is moving. a miss resets the count." : "the button"}
      >
        <button type="button" className={`clicker__btn ${moving ? "clicker__btn--moving" : ""}`} style={style} onClick={click} aria-label={`the button. clicked ${count} times`}>
          {label}
        </button>
      </div>
      <p className="clicker__note" aria-live="polite">
        {note}
      </p>
      <p className="mono tiny" style={{ opacity: 0.5 }}>
        {milestones.length ? `next: ${milestones.find((m) => m.at > count)?.at ?? "—"}` : ""}
        {moving ? " · don't miss." : count >= moveAt - 20 ? ` · at ${moveAt} it moves.` : ""}
      </p>
    </div>
  );
}
