"use client";

import { useVisitor } from "@/state/visitorStore";
import { playSound, setSoundEnabled } from "@/lib/sound";

export function SoundToggle({ className }: { className?: string }) {
  const enabled = useVisitor((s) => s.soundEnabled);
  const setSound = useVisitor((s) => s.setSound);
  return (
    <button
      type="button"
      className={`sound-toggle ${className ?? ""}`}
      aria-pressed={enabled}
      aria-label={enabled ? "sound on. click to mute" : "sound off. click to enable"}
      title={enabled ? "sound: on" : "sound: off"}
      onClick={() => {
        const next = !enabled;
        setSoundEnabled(next);
        setSound(next);
        if (next) playSound("blip");
      }}
    >
      <span aria-hidden="true">{enabled ? "♪" : "♪̶"}</span>
      <span className="sound-toggle__label">{enabled ? "sound on" : "sound off"}</span>
    </button>
  );
}
