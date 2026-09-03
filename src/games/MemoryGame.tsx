"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";
import { playSound } from "@/lib/sound";

const PADS = ["✦", "◆", "●", "▲"];

export function MemoryGame({ settings, mood, report }: GameProps) {
  const { startLength, winLength } = settings.memory;
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "lost" | "won">("idle");
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<typeof phase>("idle");
  const inputRef = useRef<number[]>([]);
  const seqRef = useRef<number[]>([]);
  const setPhaseSafe = (p: typeof phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const show = (s: number[]) => {
    setPhaseSafe("show");
    inputRef.current = [];
    setInput([]);
    clearTimers();
    const speed = mood === "transformed" ? 260 : mood === "dark" ? 360 : 480;
    s.forEach((pad, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(pad);
          playSound("blip");
        }, i * speed),
      );
      timers.current.push(window.setTimeout(() => setLit(null), i * speed + speed * 0.6));
    });
    timers.current.push(window.setTimeout(() => setPhaseSafe("input"), s.length * speed + 100));
  };

  const setSeqSafe = (s: number[]) => {
    seqRef.current = s;
    setSeq(s);
  };

  const start = () => {
    const s = Array.from({ length: startLength }, () => Math.floor(Math.random() * 4));
    setSeqSafe(s);
    show(s);
  };

  const press = (pad: number) => {
    if (phaseRef.current !== "input") return;
    setLit(pad);
    window.setTimeout(() => setLit(null), 150);
    const current = seqRef.current;
    const next = [...inputRef.current, pad];
    inputRef.current = next;
    setInput(next);
    const idx = next.length - 1;
    if (current[idx] !== pad) {
      setPhaseSafe("lost");
      report("loss");
      return;
    }
    if (next.length === current.length) {
      if (current.length >= winLength) {
        setPhaseSafe("won");
        report("win");
        return;
      }
      const grown = [...current, Math.floor(Math.random() * 4)];
      if (mood === "transformed" && Math.random() < 0.25) grown[Math.floor(Math.random() * (grown.length - 1))] = Math.floor(Math.random() * 4);
      setSeqSafe(grown);
      setPhaseSafe("show");
      timers.current.push(window.setTimeout(() => show(grown), 700));
    }
  };

  return (
    <div>
      <p className="game__status">
        {phase === "idle" && "press start"}
        {phase === "show" && (mood === "transformed" ? "watch. it might lie." : "watch…")}
        {phase === "input" && `your turn (${input.length}/${seq.length})`}
        {phase === "lost" && "wrong."}
        {phase === "won" && "you remembered everything."}
      </p>
      <div className="memory-pad" role="group" aria-label="memory pads">
        {PADS.map((p, i) => (
          <button key={i} type="button" data-lit={lit === i} onClick={() => press(i)} aria-label={`pad ${i + 1}`} disabled={phase !== "input"}>
            {p}
          </button>
        ))}
      </div>
      <div className="game__actions">
        <button type="button" className="btn btn--pixel" onClick={start}>
          {phase === "idle" ? "start" : "restart"}
        </button>
        <span className="mono tiny" style={{ alignSelf: "center" }}>
          length {seq.length || startLength} → {winLength}
        </span>
      </div>
    </div>
  );
}
