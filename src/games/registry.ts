import type { ComponentType } from "react";
import type { GameId } from "@/state/visitorStore";
import type { GameProps } from "./types";
import { ReactionGame } from "./ReactionGame";
import { MemoryGame } from "./MemoryGame";
import { ClickerGame } from "./ClickerGame";
import { HideSeekGame } from "./HideSeekGame";
import { ImpossibleButton } from "./ImpossibleButton";
import { CrossingGame } from "./CrossingGame";

export type GameDef = {
  id: GameId;
  title: string;
  darkTitle: string;
  blurb: string;
  Component: ComponentType<GameProps>;
};

export const GAMES: GameDef[] = [
  { id: "reaction", title: "react", darkTitle: "too slow", blurb: "click when it says go. not before.", Component: ReactionGame },
  { id: "memory", title: "remember", darkTitle: "forget", blurb: "watch the pattern. repeat it. it gets longer.", Component: MemoryGame },
  { id: "clicker", title: "the button", darkTitle: "the button", blurb: "click it. keep clicking it. see what it does.", Component: ClickerGame },
  { id: "hideseek", title: "hide & seek", darkTitle: "dig", blurb: "a yard. rocks. push them. see what's under.", Component: HideSeekGame },
  { id: "impossible", title: "impossible button", darkTitle: "catch it", blurb: "a button that does not want to be clicked.", Component: ImpossibleButton },
  { id: "crossing", title: "the road", darkTitle: "cross", blurb: "a pink cube. lanes of traffic. get to the other side.", Component: CrossingGame },
];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}
