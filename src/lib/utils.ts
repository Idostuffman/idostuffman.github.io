"use client";

import { useEffect, useState } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function pick<T>(arr: T[], seed: string | number): T {
  const r = typeof seed === "number" ? seed % 1 : seeded(seed);
  return arr[Math.floor(r * arr.length) % arr.length];
}

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return touch;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useIsMobile(breakpoint = 720): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function corrupt(text: string, amount: number, seed = 0): string {
  if (amount <= 0) return text;
  const glyphs = "▒░▓█?¿∆⌐¬×÷ø¤§";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const r = seeded(`${seed}-${i}-${ch}`);
    out += ch !== " " && r < amount ? glyphs[Math.floor(seeded(`${i}-${seed}`) * glyphs.length)] : ch;
  }
  return out;
}
