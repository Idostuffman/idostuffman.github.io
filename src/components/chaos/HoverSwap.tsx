"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function HoverSwap({ text, alt, className }: { text: string; alt: string; className?: string }) {
  const [tapped, setTapped] = useState(false);
  return (
    <button
      type="button"
      className={cn("fake-deco hover-swap", tapped && "hover-swap--on", className)}
      aria-label={text}
      onClick={() => setTapped((t) => !t)}
    >
      <span className="hover-swap__a" aria-hidden="true">
        {text}
      </span>
      <span className="hover-swap__b" aria-hidden="true">
        {alt}
      </span>
    </button>
  );
}
