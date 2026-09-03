"use client";

import { useEffect } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";

export function WhisperLayer() {
  const content = useContent();
  const depth = useVisitor((s) => s.depth);
  const pushMessage = useVisitor((s) => s.pushMessage);

  useEffect(() => {
    if (depth < 1) return;
    const level = content.deepLevels.find((l) => l.depth === depth);
    const pool = level?.whispers ?? [];
    if (!pool.length) return;
    const interval = Math.max(25, 90 - depth * 9) * 1000;
    let i = Math.floor(Math.random() * pool.length);
    const t = window.setInterval(() => {
      pushMessage(pool[i % pool.length], depth >= 5 ? "glitch" : "whisper", 5000);
      i++;
    }, interval);
    return () => window.clearInterval(t);
  }, [depth, content.deepLevels, pushMessage]);

  return null;
}
