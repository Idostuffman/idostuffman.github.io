"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useContent } from "@/content/ContentProvider";
import { getGame } from "@/games/registry";
import { useVisitor } from "@/state/visitorStore";
import { useGameResult } from "@/games/useGameResult";
import type { GameId } from "@/state/visitorStore";
import { GlitchText } from "@/components/chaos/Glitch";

export function GamePlayer({ gameId }: { gameId: string }) {
  const content = useContent();
  const def = getGame(gameId);
  if (!def) {
    return (
      <div className="page secret__locked">
        <p className="pixel" style={{ fontSize: "1.6rem" }}>
          that game doesn&apos;t exist
        </p>
        <Link href="/games">back to the room</Link>
      </div>
    );
  }
  return <Player id={def.id} />;
}

function Player({ id }: { id: GameId }) {
  const content = useContent();
  const def = getGame(id)!;
  const { report, mood, stats } = useGameResult(id);
  const Game = def.Component;
  const setExtraEyes = useVisitor((s) => s.setExtraEyes);

  useEffect(() => {
    setExtraEyes(mood === "transformed" ? 4 : mood === "dark" ? 1 : 0);
    return () => setExtraEyes(0);
  }, [mood, setExtraEyes]);
  return (
    <div className="page page--narrow gameroom" data-mood={mood === "normal" ? undefined : "dark"}>
      <p className="mono tiny">
        <Link href="/games">← the room</Link>
      </p>
      <h1 className="pixel" style={{ fontSize: "2.6rem", fontWeight: 400 }}>
        {mood === "normal" ? def.title : <GlitchText text={def.darkTitle} />}
      </h1>
      <div className="game">
        <Game settings={content.games} mood={mood} report={report} />
        <div className="game__hud">
          <span>
            wins {stats.wins} · losses {stats.losses} · tries {stats.attempts}
          </span>
          <span style={{ opacity: 0.6 }}>{mood === "normal" ? "" : mood === "dark" ? "watched" : "very watched"}</span>
        </div>
      </div>
    </div>
  );
}
