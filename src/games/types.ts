import type { GameSettings } from "@/content/schema";

export type Mood = "normal" | "dark" | "transformed";

export type GameResult = "win" | "loss";

export type GameProps = {
  settings: GameSettings;
  mood: Mood;
  report: (result: GameResult) => void;
};
