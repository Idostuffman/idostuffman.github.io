"use client";

import { useCallback, useEffect } from "react";
import { useContent } from "@/content/ContentProvider";
import { useVisitor, type GameId } from "@/state/visitorStore";
import { emit } from "@/interactions/events";
import { playSound } from "@/lib/sound";
import { checkRewards } from "@/lib/progression";
import type { GameResult, Mood } from "./types";

export function useMood(): Mood {
  const content = useContent();
  const totalLosses = useVisitor((s) => s.totalLosses);
  const eyes = useVisitor((s) => s.eyesUnlocked);
  if (totalLosses >= content.games.transformThreshold) return "transformed";
  if (eyes || totalLosses >= content.games.eyeThreshold) return "dark";
  return "normal";
}

export function useGameResult(game: GameId) {
  const content = useContent();
  const recordGame = useVisitor((s) => s.recordGame);
  const setCurrentGame = useVisitor((s) => s.setCurrentGame);
  const pushMessage = useVisitor((s) => s.pushMessage);
  const unlockEyes = useVisitor((s) => s.unlockEyes);
  const addEyes = useVisitor((s) => s.addEyes);
  const addDepth = useVisitor((s) => s.addDepth);
  const stats = useVisitor((s) => s.games[game]);
  const mood = useMood();

  useEffect(() => {
    setCurrentGame(game);
    return () => setCurrentGame(null);
  }, [game, setCurrentGame]);

  const report = useCallback(
    (result: GameResult) => {
      recordGame(game, result);
      const s = useVisitor.getState();
      const { lossMessages, eyeThreshold, transformThreshold } = content.games;

      if (result === "win") {
        playSound("win");
        pushMessage(s.eyesUnlocked ? "they saw that." : "nice.", "note", 2000);
        checkRewards(content, game, { wins: s.games[game]?.wins ?? 0 });
      } else {
        playSound("wrong");
        const idx = Math.min(lossMessages.length - 1, s.consecutiveLosses - 1);
        const msg = lossMessages[idx] ?? "...";
        pushMessage(msg, s.totalLosses >= eyeThreshold ? "whisper" : "note", 3500);

        if (s.totalLosses === eyeThreshold) {
          unlockEyes();
          addEyes(1);
          addDepth(1);
          playSound("hum");
        } else if (s.totalLosses > eyeThreshold && s.totalLosses % 2 === 0) {
          addEyes(1);
        }
        if (s.totalLosses === transformThreshold) {
          addDepth(1);
          addEyes(3);
          pushMessage("the room is different now.", "glitch", 5000);
        }
      }

      emit("game:result", {
        game,
        result,
        totalLosses: useVisitor.getState().totalLosses,
        consecutiveLosses: useVisitor.getState().consecutiveLosses,
      });
    },
    [game, content, recordGame, pushMessage, unlockEyes, addEyes, addDepth],
  );

  return { report, mood, stats };
}
