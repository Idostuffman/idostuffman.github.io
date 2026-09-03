"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { describeItem, requiredCount } from "@/lib/progression";
import { DraggableWindow } from "@/components/chaos/DraggableWindow";
import { Portal } from "@/components/chaos/Portal";
import { KeyAssembly } from "./KeyAssembly";
import { playSound } from "@/lib/sound";
import { asset } from "@/lib/asset";

export function PocketContents() {
  const content = useContent();
  const state = useVisitor();
  const run = state.run;
  const [assembling, setAssembling] = useState(false);
  const need = requiredCount(content);
  const fragments = content.progression.fragments;
  const items = content.progression.items.filter((i) => run.inventory.includes(i.id));
  const anyFragment = run.fragments.length > 0;

  return (
    <div className="pocket">
      <section className="pocket__key" aria-label="key">
        <h3 className="pocket__h hand">the key</h3>
        <div className="pocket__slots">
          {Array.from({ length: need }, (_, i) => {
            const collected = fragments.filter((f) => run.fragments.includes(f.id));
            const f = collected[i];
            const nextHint = !f ? fragments.find((x) => !run.fragments.includes(x.id)) : undefined;
            return (
              <div key={i} className={`pocket__slot ${f ? "pocket__slot--full" : ""}`} title={f ? f.description : ""}>
                <span className="pocket__glyph pixel">{f ? "▣" : "▢"}</span>
                <span className="pocket__slotname">{f ? f.name : anyFragment && nextHint && i === collected.length ? nextHint.hint || "?" : "[ ? ]"}</span>
              </div>
            );
          })}
        </div>
        {run.code && !run.codeRevealed && (
          <button
            type="button"
            className="btn btn--pixel pocket__assembled"
            onClick={() => {
              playSound("hum");
              setAssembling(true);
            }}
          >
            the pieces fit. look closer.
          </button>
        )}
        {run.code && run.codeRevealed && (
          <div className="pocket__note hand">
            <span className="mono tiny">torn note</span>
            <strong className="pocket__code mono">{run.code}</strong>
            <span>{content.progression.messages.noteBack}</span>
          </div>
        )}
        {!anyFragment && <p className="mono tiny pocket__hint">{content.progression.messages.pocketHint}</p>}
      </section>

      <section aria-label="things">
        <h3 className="pocket__h hand">things</h3>
        {items.length === 0 && <p className="mono tiny pocket__hint">nothing yet.</p>}
        <ul className="pocket__items">
          {items.map((it) => (
            <li key={it.id} className={`pocket__item pocket__item--${it.rarity.replace(/\W/g, "")}`}>
              <span className="pocket__icon">{it.image ? <img src={asset(it.image)} alt="" /> : it.icon}</span>
              <span>
                <span className="pocket__name">{it.name}</span>
                <span className="pocket__desc">{describeItem(it, state, content.identity.name)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {assembling && <KeyAssembly onDone={() => setAssembling(false)} />}
    </div>
  );
}

export function PocketWindow({ onClose }: { onClose: () => void }) {
  return (
    <Portal>
      <div className="pocket-window">
        <DraggableWindow title="pocket" closable onClose={onClose} width="min(92vw, 420px)">
          <PocketContents />
        </DraggableWindow>
      </div>
    </Portal>
  );
}

export function PocketButton() {
  const pathname = usePathname() ?? "/";
  const hydrated = useVisitor((s) => s.hydrated);
  const count = useVisitor((s) => s.run.inventory.length + s.run.fragments.length);
  const pulse = useVisitor((s) => !!s.run.code && !s.run.codeRevealed);
  const [open, setOpen] = useState(false);
  if (!hydrated) return null;
  if (count === 0 && !pathname.startsWith("/games") && pathname !== "/pocket") return null;
  if (pathname === "/pocket") return null;
  return (
    <>
      <button
        type="button"
        className={`pocket-tag hand ${pulse ? "pocket-tag--pulse" : ""}`}
        onClick={() => {
          playSound("click");
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={`pocket, ${count} things`}
      >
        pocket{count > 0 ? ` · ${count}` : ""}
      </button>
      {open && <PocketWindow onClose={() => setOpen(false)} />}
    </>
  );
}
