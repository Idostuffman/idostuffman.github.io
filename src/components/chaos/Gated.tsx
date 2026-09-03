"use client";

import type { ReactNode } from "react";
import { useVisitor } from "@/state/visitorStore";
import { useTargetState } from "@/interactions/useInteractionTarget";

export function Gated({ min, children, max }: { min: number; max?: number; children: ReactNode }) {
  const depth = useVisitor((s) => s.depth);
  if (depth < min) return null;
  if (max !== undefined && depth > max) return null;
  return <>{children}</>;
}

export function Revealable({ id, initially = false, children }: { id: string; initially?: boolean; children: ReactNode }) {
  const { revealed, hidden } = useTargetState(id);
  if (hidden) return null;
  if (!initially && !revealed) return null;
  return <>{children}</>;
}

export function OverrideText({ id, children }: { id: string; children: string }) {
  const { text } = useTargetState(id);
  return <>{text ?? children}</>;
}

export function useOverrideImage(id: string, fallback: string): string {
  const { image } = useTargetState(id);
  return image ?? fallback;
}
