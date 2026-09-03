"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

type State = "idle" | "wait" | "go" | "early" | "done";

export function ReactionGame({ settings, mood, report }: GameProps) {
  const { rounds, windowMs } = settings.reaction;
  const [state, setState] = useState<State>("idle");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const goAt = useRef(0);
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const start = () => {
    setState("wait");
    clear();
    const delay = 900 + Math.random() * (mood === "normal" ? 2200 : 3800);
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now();
      setState("go");
      timer.current = window.setTimeout(() => {
        setState("idle");
        setRound(0);
        setTimes([]);
        report("loss");
      }, windowMs);
    }, delay);
  };

  const hit = () => {
    if (state === "idle" || state === "early" || state === "done") {
      setRound(0);
      setTimes([]);
      start();
      return;
    }
    if (state === "wait") {
      clear();
      setState("early");
      setRound(0);
      setTimes([]);
      report("loss");
      return;
    }
    if (state === "go") {
      clear();
      const t = Math.round(performance.now() - goAt.current);
      const next = round + 1;
      setTimes((ts) => [...ts, t]);
      if (next >= rounds) {
        setState("done");
        setRound(0);
        report("win");
      } else {
        setRound(next);
        start();
      }
    }
  };

  const label =
    state === "idle"
      ? "click to start"
      : state === "wait"
        ? mood === "transformed"
          ? "wait. wait. wait."
          : "wait for it…"
        : state === "go"
          ? "GO"
          : state === "early"
            ? "too early. click to retry"
            : "you did it. again?";

  return (
    <div>
      <p className="game__status">
        round {Math.min(round + 1, rounds)} / {rounds}
        {times.length > 0 && <span className="mono tiny"> · last {times[times.length - 1]}ms</span>}
      </p>
      <button type="button" className="game__big" data-state={state} onPointerDown={hit} onKeyDown={(e) => e.key === " " && hit()}>
        {label}
      </button>
      <p className="mono tiny" style={{ marginTop: "0.6rem", opacity: 0.6 }}>
        window: {windowMs}ms. space bar works too.
      </p>
    </div>
  );
}
