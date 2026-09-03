"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useContent, useStrings } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { GAMES } from "@/games/registry";
import { useMood } from "@/games/useGameResult";
import { GlitchText } from "@/components/chaos/Glitch";
import { RealEye } from "@/components/chaos/RealEye";

export function GameRoom() {
  const content = useContent();
  const t = useStrings();
  const mood = useMood();
  const games = useVisitor((s) => s.games);
  const totalLosses = useVisitor((s) => s.totalLosses);
  const totalWins = useVisitor((s) => s.totalWins);
  const eyeCount = useVisitor((s) => s.eyeCount);
  const setExtraEyes = useVisitor((s) => s.setExtraEyes);

  useEffect(() => {
    setExtraEyes(mood === "transformed" ? 6 : mood === "dark" ? 2 : 0);
    return () => setExtraEyes(0);
  }, [mood, setExtraEyes]);

  return (
    <div className={`page gameroom`} data-mood={mood === "normal" ? undefined : "dark"}>
      <h1 className="huge pixel" style={{ fontWeight: 400 }}>
        {mood === "transformed" ? <GlitchText text="the room" /> : mood === "dark" ? <GlitchText text={t("games.title", "game room")} /> : t("games.title", "game room")}
      </h1>
      <p className="hand" style={{ fontSize: "1.4rem" }}>
        {mood === "normal" ? t("games.intro", "small games.") : mood === "dark" ? "you've been losing. they noticed." : "this isn't really a game room anymore."}
      </p>

      <div className="gameroom__scoreboard" aria-label="scoreboard">
        <span>wins {totalWins}</span>
        <span>losses {totalLosses}</span>
        {eyeCount > 0 && <span>{t("eyes.note", "the eyes are only decoration")}</span>}
      </div>

      <p className="mono tiny" style={{ opacity: 0.7 }}>
        <Link href="/pocket">pocket →</Link> some games leave things behind.
      </p>
      <div className="gameroom__grid">
        {GAMES.map((g, i) => {
          const s = games[g.id];
          return (
            <Link key={g.id} href={`/games/${g.id}`} className="gamecard" style={{ "--r": `${((i % 3) - 1) * 1.5}deg` } as React.CSSProperties}>
              <h2 className="gamecard__title">{mood === "normal" ? g.title : g.darkTitle}</h2>
              <p style={{ margin: "0.3rem 0 0.5rem", fontSize: "0.9rem" }}>{g.blurb}</p>
              <div className="gamecard__stats">
                {s.wins}w / {s.losses}l / {s.attempts} tries
              </div>
            </Link>
          );
        })}
      </div>

      {mood === "transformed" && (
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "2rem", opacity: 0.85 }}>
          <RealEye size={90} />
          <p className="mono tiny">
            losses: {totalLosses}. threshold was {content.games.transformThreshold}. the room changed at that number. it will not change back.
          </p>
        </div>
      )}
    </div>
  );
}
