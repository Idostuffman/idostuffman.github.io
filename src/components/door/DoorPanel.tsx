"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { CODE_ALPHABET, normalizeCode } from "@/lib/progression";
import { RealEyeLayer } from "@/components/chaos/RealEyeLayer";
import { corrupt } from "@/lib/utils";
import { playSound } from "@/lib/sound";

const KEYS = CODE_ALPHABET.split("");

export function DoorPanel() {
  const content = useContent();
  const router = useRouter();
  const door = content.progression.door;
  const hydrated = useVisitor((s) => s.hydrated);
  const run = useVisitor((s) => s.run);
  const bumpCodeAttempts = useVisitor((s) => s.bumpCodeAttempts);
  const unlockBasement = useVisitor((s) => s.unlockBasement);
  const setDepth = useVisitor((s) => s.setDepth);
  const depth = useVisitor((s) => s.depth);
  const [value, setValue] = useState("");
  const [line, setLine] = useState("");
  const [opening, setOpening] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLDivElement>(null);
  const attempts = run.codeAttempts;

  useEffect(() => {
    if (!hydrated) return;
    setLine(run.fragments.length === 0 ? door.noKeyText : door.prompt);
  }, [hydrated, run.fragments.length, door.noKeyText, door.prompt]);

  const type = (ch: string) => {
    if (opening) return;
    const clean = normalizeCode(ch);
    if (!clean) return;
    setValue((v) => (v.length >= 6 ? v : v + clean).slice(0, 6));
    playSound("click");
  };

  const submit = () => {
    if (opening || !value) return;
    const ok = !!run.code && normalizeCode(value) === normalizeCode(run.code);
    if (ok) {
      setLine(door.successText);
      setOpening(true);
      playSound("hum");
      unlockBasement();
      if (depth < 8) setDepth(8);
      window.setTimeout(() => router.push("/basement"), 2200);
      return;
    }
    const n = bumpCodeAttempts();
    const msgs = door.wrongMessages;
    setLine(msgs[Math.min(msgs.length - 1, n - 1)] ?? "no.");
    setShake((s) => s + 1);
    playSound(n >= 3 ? "glitch" : "wrong");
    setValue("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        submit();
        return;
      }
      if (e.key === "Backspace") {
        setValue((v) => v.slice(0, -1));
        return;
      }
      if (e.key.length === 1) type(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [value, opening, run.code]);

  const shown = value.padEnd(6, "·").replace(/(..)(..)(..)/, "$1-$2-$3");
  const corrupted = attempts >= 3 ? corrupt(shown, Math.min(0.5, (attempts - 2) * 0.12), attempts) : shown;
  const eyeLevel = (attempts >= 6 ? 3 : attempts >= 3 ? 2 : 1) as 1 | 2 | 3;

  return (
    <div className={`door ${opening ? "door--opening" : ""}`} data-attempts={attempts}>
      <div className="door__frame" key={shake} style={{ animation: shake ? "door-shake 300ms ease" : undefined }}>
        <div className="door__screen">
          <p className="door__title">{door.title}</p>
          <p className="door__line" aria-live="polite">
            &gt; {line}
          </p>
          <div ref={inputRef} className="door__input" aria-label="code">
            <span className={attempts >= 3 ? "door__corrupt" : ""}>{corrupted}</span>
            <span className="door__cursor" aria-hidden="true">
              _
            </span>
          </div>
          {attempts >= 5 && <p className="door__hint">{door.hintAfter}</p>}
        </div>
        <div className="door__pad" role="group" aria-label="keypad">
          {KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              className="door__key hand"
              style={{ "--r": `${((i * 7) % 9) - 4}deg` } as React.CSSProperties}
              onClick={() => type(k)}
              disabled={opening}
            >
              {attempts >= 4 && (i * 13) % 7 === 0 ? corrupt(k, 1, i) : k}
            </button>
          ))}
          <button type="button" className="door__key door__key--wide hand" onClick={() => setValue((v) => v.slice(0, -1))} disabled={opening}>
            ←
          </button>
          <button type="button" className="door__key door__key--wide door__key--enter hand" onClick={submit} disabled={opening}>
            {attempts >= 4 ? "open?" : "open"}
          </button>
        </div>
        <p className="door__foot mono tiny">
          <Link href="/">up</Link> · {door.hint}
        </p>
      </div>
      {attempts >= 2 && !opening && <RealEyeLayer level={eyeLevel} config={content.basement.eyes} boost={Math.min(6, attempts)} />}
    </div>
  );
}
