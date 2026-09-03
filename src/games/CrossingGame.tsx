"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { checkRewards } from "@/lib/progression";
import { playSound } from "@/lib/sound";

type Lane = { row: number; dir: 1 | -1; speed: number; len: number; gap: number; weird: boolean; wrongWay: boolean; xs: number[]; color: string };
type Sim = {
  cols: number;
  rows: number;
  lanes: Lane[];
  safeRows: Set<number>;
  player: { c: number; r: number };
  crossings: number;
  alive: boolean;
  frozen: number;
  freezeText: string;
  last: number;
  started: boolean;
  reportedWin: boolean;
};

const COLORS = ["#d94f4f", "#4f7dd9", "#e0b23c", "#5aa46b", "#c65ac6", "#e07a3c"];
const MARGIN = 2;

export function CrossingGame({ settings, mood, report }: GameProps) {
  const cfg = settings.crossing;
  const content = useContent();
  const depth = useVisitor((s) => s.depth);
  const recordCrossing = useVisitor((s) => s.recordCrossing);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim | null>(null);
  const [status, setStatus] = useState("press start (arrows / wasd)");
  const [crossings, setCrossings] = useState(0);
  const [phase, setPhase] = useState<"idle" | "play" | "dead">("idle");
  const [overlay, setOverlay] = useState<string | null>(null);
  const cell = useRef(40);

  const weirdness = () => (mood === "transformed" ? 0.35 : 0) + Math.max(0, depth - 2) * 0.05;

  const buildLanes = (n: number): Pick<Sim, "lanes" | "rows" | "safeRows"> => {
    const laneCount = Math.min(cfg.maxLanes, cfg.startLanes + Math.floor(n / 2));
    const lanes: Lane[] = [];
    const safeRows = new Set<number>([0]);
    let row = 1;
    let sinceSafe = 0;
    for (let i = 0; i < laneCount; i++) {
      if (sinceSafe === 3) {
        safeRows.add(row);
        row++;
        sinceSafe = 0;
      }
      const speed = (cfg.baseSpeed + cfg.speedStep * n) * (0.8 + Math.random() * 0.5);
      const gap = Math.max(cfg.minGap, cfg.spawnGap - n * 0.25 + Math.random() * 0.6);
      const len = Math.random() < 0.3 ? 2 : 1;
      const weird = (n >= cfg.weirdFrom || depth >= 3) && Math.random() < 0.25 + weirdness();
      const total = cfg.cols + MARGIN * 2;
      const period = len + gap;
      const count = Math.max(1, Math.floor(total / period));
      const offset = Math.random() * period;
      const xs = Array.from({ length: count }, (_, k) => (offset + k * period) % total);
      lanes.push({
        row,
        dir: i % 2 === 0 ? 1 : -1,
        speed,
        len,
        gap,
        weird,
        wrongWay: depth >= 5 && Math.random() < 0.15,
        xs,
        color: COLORS[(i + n) % COLORS.length],
      });
      row++;
      sinceSafe++;
    }
    safeRows.add(row);
    return { lanes, rows: row + 1, safeRows };
  };

  const resize = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const s = sim.current;
    if (!wrap || !canvas || !s) return;
    const w = Math.min(wrap.clientWidth, 520);
    cell.current = Math.max(22, Math.floor(w / s.cols));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cell.current * s.cols * dpr;
    canvas.height = cell.current * s.rows * dpr;
    canvas.style.width = `${cell.current * s.cols}px`;
    canvas.style.height = `${cell.current * s.rows}px`;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const start = () => {
    const built = buildLanes(0);
    sim.current = {
      cols: cfg.cols,
      ...built,
      player: { c: Math.floor(cfg.cols / 2), r: built.rows - 1 },
      crossings: 0,
      alive: true,
      frozen: 0,
      freezeText: "",
      last: performance.now(),
      started: true,
      reportedWin: false,
    };
    setCrossings(0);
    setOverlay(null);
    setPhase("play");
    setStatus("cross.");
    resize();
    draw();
  };

  const onCrossed = () => {
    const s = sim.current!;
    s.crossings += 1;
    setCrossings(s.crossings);
    recordCrossing(s.crossings);
    playSound("win");
    const got = checkRewards(content, "crossing", { crossings: s.crossings, score: s.crossings });
    if (got.fragments.length) {
      s.frozen = 2200;
      s.freezeText = "the traffic stopped.";
      setOverlay("the traffic stopped.");
    }
    if (s.crossings >= cfg.winCrossings && !s.reportedWin) {
      s.reportedWin = true;
      report("win");
    }
    const built = buildLanes(s.crossings);
    Object.assign(s, built);
    s.player = { c: Math.floor(s.cols / 2), r: s.rows - 1 };
    setStatus(s.crossings === 1 ? "again. it's faster now." : s.crossings < cfg.winCrossings ? "keep going." : "you can stop. or not.");
    resize();
  };

  const hit = () => {
    const s = sim.current!;
    s.alive = false;
    setPhase("dead");
    setOverlay("hit.");
    setStatus("hit.");
    playSound("wrong");
    report("loss");
  };

  const move = (dc: number, dr: number) => {
    const s = sim.current;
    if (!s || !s.alive || s.frozen > 0) return;
    const c = Math.max(0, Math.min(s.cols - 1, s.player.c + dc));
    const r = Math.max(0, Math.min(s.rows - 1, s.player.r + dr));
    s.player = { c, r };
    playSound("click");
    if (r === 0) onCrossed();
  };

  const step = (dt: number) => {
    const s = sim.current;
    if (!s || !s.started) return;
    if (s.frozen > 0) {
      s.frozen -= dt;
      if (s.frozen <= 0) {
        s.frozen = 0;
        setOverlay(null);
      }
      return;
    }
    if (!s.alive) return;
    const total = s.cols + MARGIN * 2;
    for (const lane of s.lanes) {
      const dir = lane.wrongWay ? -lane.dir : lane.dir;
      for (let i = 0; i < lane.xs.length; i++) {
        lane.xs[i] = (((lane.xs[i] + dir * lane.speed * (dt / 1000)) % total) + total) % total;
      }
      if (lane.row === s.player.r) {
        const px = s.player.c + 0.15;
        const pw = 0.7;
        for (const x of lane.xs) {
          const vx = x - MARGIN;
          if (vx < px + pw && vx + lane.len > px) {
            hit();
            return;
          }
        }
      }
    }
  };

  const draw = () => {
    const s = sim.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cs = cell.current;
    const W = s.cols * cs;
    const dark = mood !== "normal" || depth >= 4;
    for (let r = 0; r < s.rows; r++) {
      const safe = s.safeRows.has(r);
      ctx.fillStyle = safe ? (dark ? "#3b4a3a" : "#7fa36a") : dark ? "#1b1b22" : "#33333a";
      ctx.fillRect(0, r * cs, W, cs);
      if (!safe) {
        ctx.strokeStyle = depth >= 5 && Math.random() < 0.1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.35)";
        ctx.setLineDash([cs * 0.4, cs * 0.4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, r * cs + cs);
        ctx.lineTo(W, r * cs + cs);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (const lane of s.lanes) {
      for (const x of lane.xs) {
        const vx = (x - MARGIN) * cs;
        const vy = lane.row * cs + cs * 0.12;
        const vw = lane.len * cs;
        const vh = cs * 0.76;
        if (lane.weird) {
          ctx.fillStyle = "#050507";
          ctx.fillRect(vx + (Math.random() - 0.5) * 2, vy, vw, vh);
          const ex = vx + vw / 2;
          const ey = vy + vh / 2;
          ctx.fillStyle = "#f2efe8";
          ctx.beginPath();
          ctx.ellipse(ex, ey, cs * 0.22, cs * 0.13, 0, 0, Math.PI * 2);
          ctx.fill();
          const px = s.player.c * cs + cs / 2;
          const py = s.player.r * cs + cs / 2;
          const ang = Math.atan2(py - ey, px - ex);
          ctx.fillStyle = "#111";
          ctx.beginPath();
          ctx.arc(ex + Math.cos(ang) * cs * 0.08, ey + Math.sin(ang) * cs * 0.04, cs * 0.07, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = lane.color;
          roundRect(ctx, vx, vy, vw, vh, cs * 0.15);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillRect(vx + vw * 0.25, vy + vh * 0.15, vw * 0.5, vh * 0.3);
        }
      }
    }
    const px = s.player.c * cs + cs * 0.15;
    const py = s.player.r * cs + cs * 0.15;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(px + 3, py + 4, cs * 0.7, cs * 0.7);
    ctx.fillStyle = "#ff6fa8";
    ctx.fillRect(px, py, cs * 0.7, cs * 0.7);
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, cs * 0.7, cs * 0.7);
    if (s.frozen > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, s.rows * cs);
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = sim.current;
      if (!s) return;
      const now = performance.now();
      const dt = Math.min(50, now - s.last);
      s.last = now;
      step(dt);
      draw();
    }, 16);
    return () => window.clearInterval(id);
  }, [mood, depth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      const map: Record<string, [number, number]> = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      const m = map[k];
      if (!m) return;
      if (!sim.current || phase !== "play") {
        if (k.startsWith("arrow")) e.preventDefault();
        return;
      }
      e.preventDefault();
      move(m[0], m[1]);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
    };
  }, [phase]);

  return (
    <div className="crossing">
      <p className="game__status">
        {status}
        <span className="mono tiny"> · crossings {crossings} / {cfg.winCrossings}</span>
      </p>
      <div ref={wrapRef} className="crossing__wrap">
        <canvas ref={canvasRef} className="crossing__canvas" aria-label="the road" role="img" />
        {overlay && (
          <div className={`crossing__overlay ${overlay === "hit." ? "" : "crossing__overlay--freeze"}`}>
            <span className="pixel">{overlay}</span>
          </div>
        )}
        {phase === "idle" && (
          <div className="crossing__overlay">
            <button type="button" className="btn btn--pixel" onClick={start}>
              start
            </button>
          </div>
        )}
        {phase === "dead" && (
          <div className="crossing__overlay">
            <span className="pixel" style={{ fontSize: "1.6rem" }}>hit.</span>
            <button type="button" className="btn btn--pixel" onClick={start}>
              again
            </button>
          </div>
        )}
      </div>
      <div className="dpad" aria-label="move">
        <button type="button" className="dpad__btn dpad__up" onClick={() => move(0, -1)} aria-label="up">▲</button>
        <button type="button" className="dpad__btn dpad__left" onClick={() => move(-1, 0)} aria-label="left">◀</button>
        <button type="button" className="dpad__btn dpad__right" onClick={() => move(1, 0)} aria-label="right">▶</button>
        <button type="button" className="dpad__btn dpad__down" onClick={() => move(0, 1)} aria-label="down">▼</button>
      </div>
      <p className="mono tiny" style={{ opacity: 0.6 }}>
        arrows or wasd. reach the top. it gets faster.
      </p>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
