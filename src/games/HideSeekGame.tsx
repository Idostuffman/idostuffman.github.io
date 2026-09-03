"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "./types";
import type { Item } from "@/content/schema";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { collectItemById, describeItem, effectiveDepth, placedItems } from "@/lib/progression";
import { RealEye } from "@/components/chaos/RealEye";
import { playSound } from "@/lib/sound";

type Tile = "dirt" | "bush" | "rock" | "debris" | "trampled";
type Grid = Tile[][];

const key = (c: number, r: number) => `${c},${r}`;

function parseArea(layout: string[]): { grid: Grid; start: { c: number; r: number } } {
  let start = { c: 0, r: 0 };
  const grid: Grid = layout.map((row, r) =>
    row.split("").map((ch, c) => {
      if (ch === "P") start = { c, r };
      if (ch === "#") return "bush";
      if (ch === "O") return "rock";
      if (ch === "x") return "debris";
      return "dirt";
    }),
  );
  const w = Math.max(...grid.map((g) => g.length));
  for (const row of grid) while (row.length < w) row.push("dirt");
  return { grid, start };
}

export function HideSeekGame({ mood, report }: GameProps) {
  const content = useContent();
  const state = useVisitor();
  const bumpHideSeek = useVisitor((s) => s.bumpHideSeek);
  const markSeen = useVisitor((s) => s.markSeen);
  const eff = effectiveDepth(state);
  const cfg = content.progression.hideSeek;

  const areas = useMemo(() => cfg.areas.filter((a) => a.depthRequired <= eff), [cfg.areas, eff]);
  const explored = state.run.hideSeek.areasExplored;
  const unlockedCount = Math.min(areas.length, explored.filter((id) => areas.some((a) => a.id === id)).length + 1);

  const [areaIdx, setAreaIdx] = useState(0);
  const area = areas[Math.min(areaIdx, Math.max(0, areas.length - 1))];
  const [grid, setGrid] = useState<Grid>([]);
  const [player, setPlayer] = useState({ c: 0, r: 0 });
  const [bushHits, setBushHits] = useState<Record<string, number>>({});
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<"idle" | "play" | "won" | "lost">("idle");
  const [note, setNote] = useState("");
  const arenaRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState<string | null>(null);

  const items = useMemo(() => {
    const map = area ? placedItems(content, area.id, eff) : new Map<string, Item>();
    for (const [cell, it] of map) if (state.run.inventory.includes(it.id)) map.delete(cell);
    return map;
  }, [area, content, eff, state.run.inventory]);

  const visible = (cell: string): Item | undefined => {
    const it = items.get(cell);
    if (!it) return undefined;
    const [c, r] = cell.split(",").map(Number);
    const tile = grid[r]?.[c];
    if (it.location.under === "rock") return tile === "rock" ? undefined : it;
    if (it.location.under === "bush") return tile === "bush" ? undefined : it;
    return it;
  };

  const startArea = (idx: number) => {
    const a = areas[idx];
    if (!a) return;
    const { grid: g, start } = parseArea(a.layout);
    setAreaIdx(idx);
    setGrid(g);
    setPlayer(start);
    setBushHits({});
    setMoves(0);
    setNote(a.intro);
    setPhase("play");
  };

  const finish = (result: "won" | "lost") => {
    setPhase(result);
    if (result === "won") {
      bumpHideSeek({ gamesCompleted: 1, area: area.id });
      setNote("that's everything here. for now.");
      report("win");
    } else {
      setNote("it got dark.");
      report("loss");
    }
  };

  const move = (dc: number, dr: number) => {
    if (phase !== "play" || !area) return;
    const nc = player.c + dc;
    const nr = player.r + dr;
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return;
    const tile = grid[nr][nc];
    const g = grid.map((row) => [...row]);
    let moved = false;

    if (tile === "bush") {
      const k = key(nc, nr);
      const hits = (bushHits[k] ?? 0) + 1;
      setBushHits({ ...bushHits, [k]: hits });
      playSound("click");
      if (hits >= cfg.bushHits) {
        g[nr][nc] = "trampled";
        setGrid(g);
        const it = items.get(k);
        if (it) {
          markSeen(it.id);
          setNote(`something was in the bush.`);
        } else setNote("just leaves.");
      } else setNote("rustle.");
    } else if (tile === "rock") {
      const bc = nc + dc;
      const br = nr + dr;
      const beyond = g[br]?.[bc];
      if (beyond === undefined || beyond !== "dirt" && beyond !== "trampled" || visible(key(bc, br))) {
        setNote("it won't go that way.");
        playSound("click");
      } else {
        g[br][bc] = "rock";
        g[nr][nc] = "dirt";
        setGrid(g);
        bumpHideSeek({ rocksMoved: 1 });
        playSound("pop");
        moved = true;
        const it = items.get(key(nc, nr));
        if (it) {
          markSeen(it.id);
          setNote(it.behavior === "watch" ? "…it was looking up." : "there was something under it.");
        } else setNote("dirt.");
      }
    } else {
      moved = true;
      const it = visible(key(nc, nr));
      if (it) {
        collectItemById(content, it.id);
        bumpHideSeek({ objectsFound: 1, found: it.id });
        markSeen(it.id);
        setNote(describeItem(it, useVisitor.getState(), content.identity.name));
      }
    }

    if (moved) setPlayer({ c: nc, r: nr });
    const m = moves + 1;
    setMoves(m);
    bumpHideSeek({ moves: 1 });

    const remaining = [...items.keys()].filter((cell) => {
      const it = items.get(cell)!;
      if (moved && cell === key(nc, nr) && visible(cell)) return false;
      return !useVisitor.getState().run.inventory.includes(it.id);
    });
    if (remaining.length === 0 && items.size > 0) {
      window.setTimeout(() => finish("won"), 250);
      return;
    }
    if (m >= cfg.moveBudget) window.setTimeout(() => finish("lost"), 250);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      const map: Record<string, [number, number]> = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      const m = map[k];
      if (!m) return;
      if (phase !== "play") return;
      e.preventDefault();
      move(m[0], m[1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onPointerMove = (e: React.PointerEvent) => {
    const arena = arenaRef.current;
    if (!arena) return;
    let closest: string | null = null;
    let best = 70;
    arena.querySelectorAll<HTMLElement>("[data-cell]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (d < best) {
        best = d;
        closest = el.dataset.cell ?? null;
      }
      const eye = el.querySelector<HTMLElement>(".realeye");
      if (eye) {
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        eye.style.setProperty("--gx", (dx / dist).toFixed(2));
        eye.style.setProperty("--gy", ((dy / dist) * 0.6).toFixed(2));
      }
    });
    setNear(closest);
  };

  if (!area) return <p className="game__status">nothing to find yet.</p>;

  const remaining = [...items.values()].length;
  const dark = mood !== "normal" || eff >= 4;

  return (
    <div className={`hs ${dark ? "hs--dark" : ""}`} data-eff={eff}>
      <p className="game__status">
        {area.name}
        <span className="mono tiny">
          {" "}
          · {Math.max(0, cfg.moveBudget - moves)} moves of light · {remaining} thing{remaining === 1 ? "" : "s"} left
        </span>
      </p>
      {phase === "idle" ? (
        <div className="hs__intro">
          <p className="hand" style={{ fontSize: "1.3rem" }}>
            {area.intro || "push the rocks. see what's under them."}
          </p>
          <div className="game__actions">
            {areas.slice(0, unlockedCount).map((a, i) => (
              <button key={a.id} type="button" className={`btn ${i === 0 ? "btn--pixel" : "btn--ghost"}`} onClick={() => startArea(i)}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={arenaRef} className="hs__arena" style={{ "--cols": grid[0]?.length ?? 9 } as React.CSSProperties} onPointerMove={onPointerMove} onPointerLeave={() => setNear(null)}>
          {grid.map((row, r) =>
            row.map((tile, c) => {
              const k = key(c, r);
              const it = visible(k);
              const isPlayer = player.c === c && player.r === r;
              return (
                <div key={k} className={`hs__cell hs__cell--${tile}`} data-cell={it ? k : undefined}>
                  {tile === "bush" && bushHits[k] ? <span className="hs__hits">{"·".repeat(bushHits[k])}</span> : null}
                  {it && (
                    <span
                      className={`hs__item hs__item--${it.behavior} ${it.behavior === "vanish" && near === k ? "hs__item--gone" : ""}`}
                      title={it.name}
                    >
                      {it.behavior === "watch" ? <RealEye size={22} halo={false} blinkEvery={5} /> : it.icon}
                    </span>
                  )}
                  {isPlayer && <span className="hs__player" aria-label="you" />}
                </div>
              );
            }),
          )}
        </div>
      )}
      {phase !== "idle" && (
        <>
          <p className="hs__note hand" aria-live="polite">
            {note}
          </p>
          <div className="dpad" aria-label="move">
            <button type="button" className="dpad__btn dpad__up" onClick={() => move(0, -1)} aria-label="up">▲</button>
            <button type="button" className="dpad__btn dpad__left" onClick={() => move(-1, 0)} aria-label="left">◀</button>
            <button type="button" className="dpad__btn dpad__right" onClick={() => move(1, 0)} aria-label="right">▶</button>
            <button type="button" className="dpad__btn dpad__down" onClick={() => move(0, 1)} aria-label="down">▼</button>
          </div>
          <div className="game__actions">
            {(phase === "won" || phase === "lost") && (
              <button type="button" className="btn btn--pixel" onClick={() => setPhase("idle")}>
                {phase === "won" ? "somewhere else" : "try again"}
              </button>
            )}
            {phase === "play" && (
              <button type="button" className="btn btn--ghost" onClick={() => setPhase("idle")}>
                leave
              </button>
            )}
          </div>
        </>
      )}
      <p className="mono tiny" style={{ opacity: 0.55, marginTop: "0.6rem" }}>
        arrows / wasd. walk into a rock to push it. bushes take a few tries. found so far: {state.run.hideSeek.objectsFound}, rocks moved: {state.run.hideSeek.rocksMoved}.
      </p>
    </div>
  );
}
