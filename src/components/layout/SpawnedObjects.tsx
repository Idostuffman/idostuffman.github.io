"use client";

import { useVisitor } from "@/state/visitorStore";
import { DraggableWindow } from "@/components/chaos/DraggableWindow";

const STICKERS = ["★", "✿", "◎", "☻", "✧", "?", "!!", "♥"];

export function SpawnedObjects() {
  const objects = useVisitor((s) => s.spawnedObjects);
  const remove = useVisitor((s) => s.removeSpawned);
  if (!objects.length) return null;
  return (
    <div className="spawned" aria-hidden="true">
      {objects.map((o) => {
        const style: React.CSSProperties = { position: "fixed", left: `${o.x}%`, top: `${o.y}%`, zIndex: 30 };
        if (o.kind === "sticker")
          return (
            <span key={o.id} className="spawned__sticker appear" style={style}>
              {STICKERS[o.id % STICKERS.length]}
            </span>
          );
        if (o.kind === "window")
          return (
            <div key={o.id} style={{ ...style, width: 240 }}>
              <DraggableWindow title="untitled" closable onClose={() => remove(o.id)}>
                <p className="mono tiny">this window was not here before.</p>
              </DraggableWindow>
            </div>
          );
        return null;
      })}
    </div>
  );
}
