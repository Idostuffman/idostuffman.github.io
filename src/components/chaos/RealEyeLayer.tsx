"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/content/schema";
import { RealEye, pickIris } from "./RealEye";
import { Portal } from "./Portal";
import { useReducedMotion } from "@/lib/utils";

type EyesConfig = SiteContent["basement"]["eyes"];

type LiveEye = {
  id: number;
  x: number;
  y: number;
  size: number;
  follow: boolean;
  behind: boolean;
  iris: string;
  flash: boolean;
  blinkEvery: number;
};

let seq = 1;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function RealEyeLayer({ level, config, boost = 0 }: { level: 1 | 2 | 3; config: EyesConfig; boost?: number }) {
  const [eyes, setEyes] = useState<LiveEye[]>([]);
  const reduced = useReducedMotion();
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const eyesRef = useRef<LiveEye[]>([]);
  eyesRef.current = eyes;

  useEffect(() => {
    const interval = config.intervals[Math.min(config.intervals.length - 1, level - 1)] ?? { min: 20, max: 60 };
    const scale = Math.max(0.25, 1 - boost * 0.15);
    let timer = 0;
    const removers: number[] = [];

    const spawn = () => {
      if (eyesRef.current.length < config.maxVisible) {
        const edge = Math.random() < 0.55;
        const flash = Math.random() < config.flashChance;
        const eye: LiveEye = {
          id: seq++,
          x: edge ? (Math.random() < 0.5 ? rand(1, 12) : rand(86, 97)) : rand(8, 90),
          y: edge ? (Math.random() < 0.5 ? rand(2, 14) : rand(80, 94)) : rand(8, 88),
          size: rand(46, 90) + level * 22 + boost * 6,
          follow: Math.random() < config.followChance,
          behind: Math.random() < 0.4,
          iris: pickIris(Math.random() * 100),
          flash,
          blinkEvery: rand(3.5, 8),
        };
        setEyes((e) => [...e, eye]);
        const life = flash ? rand(160, 380) : rand(900, 2600) + level * 900;
        removers.push(window.setTimeout(() => setEyes((e) => e.filter((x) => x.id !== eye.id)), life));
      }
      timer = window.setTimeout(spawn, rand(interval.min, interval.max) * 1000 * scale);
    };
    timer = window.setTimeout(spawn, rand(interval.min * 0.5, interval.max * 0.8) * 1000 * scale);
    return () => {
      window.clearTimeout(timer);
      removers.forEach((t) => window.clearTimeout(t));
    };
  }, [level, config, boost]);

  useEffect(() => {
    if (reduced) return;
    const glance = window.setInterval(() => {
      nodes.current.forEach((el, id) => {
        const eye = eyesRef.current.find((e) => e.id === id);
        if (!eye || eye.follow) return;
        if (Math.random() < config.lookChance) {
          el.style.setProperty("--gx", rand(-0.7, 0.7).toFixed(2));
          el.style.setProperty("--gy", rand(-0.4, 0.4).toFixed(2));
        }
      });
    }, 900);

    let last = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 32) return;
      last = now;
      const gone: number[] = [];
      nodes.current.forEach((el, id) => {
        const eye = eyesRef.current.find((x) => x.id === id);
        if (!eye) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < config.hideRadius) {
          gone.push(id);
          return;
        }
        if (eye.follow) {
          const k = Math.min(1, dist / 500);
          el.style.setProperty("--gx", ((dx / dist) * k).toFixed(2));
          el.style.setProperty("--gy", ((dy / dist) * k).toFixed(2));
        }
      });
      if (gone.length) setEyes((es) => es.filter((x) => !gone.includes(x.id)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearInterval(glance);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced, config.lookChance, config.hideRadius]);

  if (!eyes.length) return null;

  return (
    <Portal>
      {eyes.map((e) => (
        <div
          key={e.id}
          ref={(el) => {
            if (el) nodes.current.set(e.id, el);
            else nodes.current.delete(e.id);
          }}
          className={`realeye-spot ${e.behind ? "realeye-spot--behind" : ""} ${e.flash ? "realeye-spot--flash" : ""}`}
          style={{ left: `${e.x}%`, top: `${e.y}%` }}
          aria-hidden="true"
        >
          <RealEye size={e.size} iris={e.iris} blinkEvery={e.flash ? 0 : e.blinkEvery} blinkDelay={rand(0, 2)} />
        </div>
      ))}
    </Portal>
  );
}
