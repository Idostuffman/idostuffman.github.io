"use client";

import { useVisitor } from "@/state/visitorStore";
import { corrupt } from "@/lib/utils";

export function GlitchText({ text, as: Tag = "span", className }: { text: string; as?: "span" | "h1" | "h2" | "p"; className?: string }) {
  const depth = useVisitor((s) => s.depth);
  const amount = depth >= 6 ? 0.18 : depth >= 5 ? 0.08 : 0;
  const shown = amount ? corrupt(text, amount, depth) : text;
  return (
    <Tag className={`glitch-text ${className ?? ""}`} data-text={shown} aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </Tag>
  );
}
