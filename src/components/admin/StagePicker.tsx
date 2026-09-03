"use client";

import Link from "next/link";
import { useContent } from "@/content/ContentProvider";
import { useVisitor, MAX_DEPTH } from "@/state/visitorStore";
import { computeEyeCount } from "@/lib/eyes";
import { generateCode, maybeAssembleKey } from "@/lib/progression";
import { playSound } from "@/lib/sound";

const PREVIEW_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/about/personality", label: "personality" },
  { href: "/art", label: "art" },
  { href: "/games", label: "game room" },
  { href: "/basement", label: "basement" },
  { href: "/void", label: "void" },
  { href: "/commissions", label: "commissions" },
];

export function StagePicker() {
  const content = useContent();
  const hydrated = useVisitor((s) => s.hydrated);
  const depth = useVisitor((s) => s.depth);
  const setDepth = useVisitor((s) => s.setDepth);
  const discoverSecret = useVisitor((s) => s.discoverSecret);
  const unlockEyes = useVisitor((s) => s.unlockEyes);
  const addEyes = useVisitor((s) => s.addEyes);
  const recordGame = useVisitor((s) => s.recordGame);
  const resetEverything = useVisitor((s) => s.resetEverything);
  const run = useVisitor((s) => s.run);
  const collectFragment = useVisitor((s) => s.collectFragment);
  const setRunCode = useVisitor((s) => s.setRunCode);
  const revealCode = useVisitor((s) => s.revealCode);
  const unlockBasement = useVisitor((s) => s.unlockBasement);
  const resetRun = useVisitor((s) => s.resetRun);
  const secrets = useVisitor((s) => s.discoveredSecrets);
  const totalLosses = useVisitor((s) => s.totalLosses);
  const eyeCount = useVisitor((s) => s.eyeCount);
  const eyesUnlocked = useVisitor((s) => s.eyesUnlocked);

  const levels = Array.from({ length: MAX_DEPTH + 1 }, (_, d) => {
    const level = content.deepLevels.find((l) => l.depth === d);
    return { depth: d, name: level?.name ?? `depth ${d}`, note: level?.note ?? "" };
  });

  const eyesAt = (d: number) =>
    computeEyeCount(
      {
        depth: d,
        eyeCount,
        eyesUnlocked,
        secretsFound: secrets.length,
        totalLosses,
        transformThreshold: content.games.transformThreshold,
      },
      content.eyes,
    );

  const pick = (d: number) => {
    setDepth(d);
    queueMicrotask(() => {
      if (useVisitor.getState().depth !== d) setDepth(d);
    });
    playSound(d > depth ? "glitch" : "blip");
  };

  return (
    <div className="page page--narrow stage">
      <h1 className="huge display">stage picker</h1>
      <p className="mono tiny" style={{ opacity: 0.8 }}>
        current stage: <strong>{hydrated ? depth : "…"}</strong> · secrets {secrets.length}/{content.secrets.length} · losses {totalLosses} ·
        eyes on screen {hydrated ? eyesAt(depth) : "…"} · fragments {run.fragments.length} · code {run.code ?? "—"} · basement{" "}
        {run.basementUnlocked ? "open" : "locked"}
      </p>
      <p className="hand" style={{ fontSize: "1.3rem" }}>
        {content.settings.persistProgress
          ? "progress is remembered between reloads (admin → Settings)."
          : "every reload starts back at the first stage. use the links below to move around without reloading, or turn on “remember progress” in admin → Settings."}
      </p>

      <div className="stage__grid" role="group" aria-label="stages">
        {levels.map((l) => (
          <button
            key={l.depth}
            type="button"
            className={`stage__card ${l.depth === depth ? "stage__card--active" : ""}`}
            onClick={() => pick(l.depth)}
            aria-pressed={l.depth === depth}
          >
            <span className="stage__num pixel">{l.depth}</span>
            <span className="stage__name">{l.name}</span>
            <span className="stage__meta mono tiny">
              {eyesAt(l.depth)} eye{eyesAt(l.depth) === 1 ? "" : "s"}
              {l.note ? ` · ${l.note}` : ""}
            </span>
          </button>
        ))}
      </div>

      <h2 className="hand" style={{ fontSize: "1.8rem", marginTop: "2rem" }}>
        other knobs
      </h2>
      <div className="game__actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            content.secrets.forEach((s) => discoverSecret(s.id));
            playSound("pop");
          }}
        >
          unlock every secret
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            unlockEyes();
            addEyes(1);
            playSound("hum");
          }}
        >
          unlock the eyes
        </button>
        <button
          type="button"
          className="btn btn--pixel"
          onClick={() => {
            const need = Math.max(0, content.games.transformThreshold - totalLosses);
            for (let i = 0; i < need; i++) recordGame("reaction", "loss");
            unlockEyes();
            addEyes(4);
            playSound("wrong");
          }}
        >
          lose {content.games.transformThreshold} games (transform the room)
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const next = content.progression.fragments.find((f) => !run.fragments.includes(f.id));
            if (next) collectFragment(next.id);
            maybeAssembleKey(content);
            playSound("pop");
          }}
        >
          grant the next fragment ({run.fragments.length}/{content.progression.fragments.length})
        </button>
        <button
          type="button"
          className="btn btn--pixel"
          onClick={() => {
            content.progression.fragments.forEach((f) => collectFragment(f.id));
            if (!run.code) setRunCode(generateCode());
            revealCode();
            playSound("hum");
          }}
        >
          give me the whole key + code
        </button>
        <button
          type="button"
          className="btn btn--pixel"
          onClick={() => {
            unlockBasement();
            setDepth(8);
            playSound("glitch");
          }}
        >
          open the basement
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            resetRun();
            playSound("click");
          }}
        >
          reset the run (pocket, key, basement)
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            resetEverything();
            playSound("click");
          }}
        >
          reset everything
        </button>
      </div>

      <h2 className="hand" style={{ fontSize: "1.8rem", marginTop: "2rem" }}>
        go look
      </h2>
      <ul className="stage__links mono">
        {PREVIEW_LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
        <li>
          <a href="/admin">admin ↗</a>
        </li>
      </ul>
    </div>
  );
}
