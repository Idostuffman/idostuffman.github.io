"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const MAX_DEPTH = 9;

export type GameId = "reaction" | "memory" | "clicker" | "hideseek" | "impossible" | "crossing";

export type GameStats = { attempts: number; wins: number; losses: number };

export type MessageStyle = "note" | "whisper" | "system" | "glitch";
export type Message = { id: number; text: string; style: MessageStyle; ttl: number };

export type VisitorState = {
  hydrated: boolean;
  depth: number;
  deepestDepth: number;
  visitedPages: Record<string, number>;
  discoveredSecrets: string[];
  interactionCounts: Record<string, number>;
  firedInteractions: string[];
  games: Record<GameId, GameStats>;
  totalLosses: number;
  consecutiveLosses: number;
  totalWins: number;
  currentGame: GameId | null;
  eyesUnlocked: boolean;
  eyeCount: number;
  soundEnabled: boolean;
  flags: Record<string, boolean>;
  revealed: string[];
  hidden: string[];
  textOverrides: Record<string, string>;
  imageOverrides: Record<string, string>;
  specialInteractions: number;
  run: RunState;
  extraEyes: number;
  messages: Message[];
  glitchUntil: number;
  spawnedObjects: { id: number; kind: "eye" | "sticker" | "window"; x: number; y: number }[];
};

export type VisitorActions = {
  setHydrated: () => void;
  addDepth: (amount: number) => void;
  setDepth: (depth: number) => void;
  visit: (path: string) => number;
  discoverSecret: (id: string) => boolean;
  bumpInteraction: (id: string) => number;
  markFired: (id: string) => void;
  resetInteraction: (id: string) => void;
  recordGame: (game: GameId, result: "win" | "loss") => void;
  setCurrentGame: (game: GameId | null) => void;
  unlockEyes: () => void;
  addEyes: (n: number) => void;
  setSound: (on: boolean) => void;
  setFlag: (key: string, value: boolean) => void;
  reveal: (id: string) => void;
  hide: (id: string) => void;
  setText: (id: string, text: string) => void;
  setImage: (id: string, src: string) => void;
  bumpSpecial: () => void;
  setExtraEyes: (n: number) => void;
  collectItem: (id: string) => boolean;
  collectFragment: (id: string) => boolean;
  setRunCode: (code: string) => void;
  revealCode: () => void;
  bumpCodeAttempts: () => number;
  unlockBasement: () => void;
  enterRoom: (slug: string, level: number) => void;
  bumpHideSeek: (patch: { objectsFound?: number; rocksMoved?: number; gamesCompleted?: number; moves?: number; area?: string; found?: string }) => void;
  recordCrossing: (score: number) => void;
  markSeen: (id: string) => number;
  resetRun: () => void;
  pushMessage: (text: string, style?: MessageStyle, ttl?: number) => void;
  dismissMessage: (id: number) => void;
  glitch: (ms: number) => void;
  spawn: (kind: "eye" | "sticker" | "window", count: number) => void;
  removeSpawned: (id: number) => void;
  resetEverything: () => void;
};

const emptyStats = (): GameStats => ({ attempts: 0, wins: 0, losses: 0 });

export type RunState = {
  id: string;
  startedAt: number;
  inventory: string[];
  fragments: string[];
  code: string | null;
  codeRevealed: boolean;
  codeAttempts: number;
  basementUnlocked: boolean;
  basementLevel: number;
  basementVisits: number;
  roomsVisited: string[];
  hideSeek: { objectsFound: number; rocksMoved: number; areasExplored: string[]; gamesCompleted: number; found: string[]; moves: number };
  crossing: { bestScore: number; crossings: number };
  seen: Record<string, number>;
};

export const emptyRun = (): RunState => ({
  id: "",
  startedAt: 0,
  inventory: [],
  fragments: [],
  code: null,
  codeRevealed: false,
  codeAttempts: 0,
  basementUnlocked: false,
  basementLevel: 0,
  basementVisits: 0,
  roomsVisited: [],
  hideSeek: { objectsFound: 0, rocksMoved: 0, areasExplored: [], gamesCompleted: 0, found: [], moves: 0 },
  crossing: { bestScore: 0, crossings: 0 },
  seen: {},
});

const runId = () => {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

function started(run: RunState): RunState {
  return run.id ? run : { ...run, id: runId(), startedAt: Date.now() };
}

const initialState: VisitorState = {
  hydrated: false,
  depth: 0,
  deepestDepth: 0,
  visitedPages: {},
  discoveredSecrets: [],
  interactionCounts: {},
  firedInteractions: [],
  games: {
    reaction: emptyStats(),
    memory: emptyStats(),
    clicker: emptyStats(),
    hideseek: emptyStats(),
    impossible: emptyStats(),
    crossing: emptyStats(),
  },
  totalLosses: 0,
  consecutiveLosses: 0,
  totalWins: 0,
  currentGame: null,
  eyesUnlocked: false,
  eyeCount: 0,
  soundEnabled: false,
  flags: {},
  revealed: [],
  hidden: [],
  textOverrides: {},
  imageOverrides: {},
  specialInteractions: 0,
  run: emptyRun(),
  extraEyes: 0,
  messages: [],
  glitchUntil: 0,
  spawnedObjects: [],
};

let messageSeq = 1;
let spawnSeq = 1;
let canPersist = false;

let persistProgress = false;
export function configurePersistence(opts: { progress: boolean }) {
  persistProgress = opts.progress;
}

const PREFERENCE_KEYS = ["soundEnabled", "run"] as const;

function stripProgress(raw: string | null): string | null {
  if (!raw) return raw;
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    const state = parsed.state ?? {};
    const kept: Record<string, unknown> = {};
    for (const k of PREFERENCE_KEYS) if (k in state) kept[k] = state[k];
    return JSON.stringify({ ...parsed, state: kept });
  } catch {
    return null;
  }
}

const clampDepth = (d: number) => Math.max(0, Math.min(MAX_DEPTH, Math.round(d)));

export const useVisitor = create<VisitorState & VisitorActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setHydrated: () => set({ hydrated: true }),
      addDepth: (amount) =>
        set((s) => {
          const depth = clampDepth(s.depth + amount);
          return { depth, deepestDepth: Math.max(s.deepestDepth, depth) };
        }),
      setDepth: (depth) =>
        set((s) => {
          const d = clampDepth(depth);
          return { depth: d, deepestDepth: Math.max(s.deepestDepth, d) };
        }),
      visit: (path) => {
        const next = (get().visitedPages[path] ?? 0) + 1;
        set((s) => ({ visitedPages: { ...s.visitedPages, [path]: next } }));
        return next;
      },
      discoverSecret: (id) => {
        if (get().discoveredSecrets.includes(id)) return false;
        set((s) => ({ discoveredSecrets: [...s.discoveredSecrets, id] }));
        return true;
      },
      bumpInteraction: (id) => {
        const next = (get().interactionCounts[id] ?? 0) + 1;
        set((s) => ({ interactionCounts: { ...s.interactionCounts, [id]: next } }));
        return next;
      },
      markFired: (id) =>
        set((s) => (s.firedInteractions.includes(id) ? s : { firedInteractions: [...s.firedInteractions, id] })),
      resetInteraction: (id) => set((s) => ({ interactionCounts: { ...s.interactionCounts, [id]: 0 } })),
      recordGame: (game, result) =>
        set((s) => {
          const stats = { ...s.games[game] };
          stats.attempts += 1;
          if (result === "win") stats.wins += 1;
          else stats.losses += 1;
          return {
            games: { ...s.games, [game]: stats },
            totalLosses: s.totalLosses + (result === "loss" ? 1 : 0),
            totalWins: s.totalWins + (result === "win" ? 1 : 0),
            consecutiveLosses: result === "loss" ? s.consecutiveLosses + 1 : 0,
          };
        }),
      setCurrentGame: (game) => set({ currentGame: game }),
      unlockEyes: () => set((s) => ({ eyesUnlocked: true, eyeCount: Math.max(1, s.eyeCount) })),
      addEyes: (n) => set((s) => ({ eyesUnlocked: true, eyeCount: Math.min(40, s.eyeCount + n) })),
      setSound: (on) => set({ soundEnabled: on }),
      setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
      reveal: (id) =>
        set((s) => ({
          revealed: s.revealed.includes(id) ? s.revealed : [...s.revealed, id],
          hidden: s.hidden.filter((h) => h !== id),
        })),
      hide: (id) =>
        set((s) => ({
          hidden: s.hidden.includes(id) ? s.hidden : [...s.hidden, id],
          revealed: s.revealed.filter((r) => r !== id),
        })),
      setText: (id, text) => set((s) => ({ textOverrides: { ...s.textOverrides, [id]: text } })),
      setImage: (id, src) => set((s) => ({ imageOverrides: { ...s.imageOverrides, [id]: src } })),
      bumpSpecial: () => set((s) => ({ specialInteractions: s.specialInteractions + 1 })),
      setExtraEyes: (n) => set({ extraEyes: n }),
      collectItem: (id) => {
        if (get().run.inventory.includes(id)) return false;
        set((s) => ({ run: { ...started(s.run), inventory: [...s.run.inventory, id] } }));
        return true;
      },
      collectFragment: (id) => {
        if (get().run.fragments.includes(id)) return false;
        set((s) => ({ run: { ...started(s.run), fragments: [...s.run.fragments, id] } }));
        return true;
      },
      setRunCode: (code) => set((s) => ({ run: { ...started(s.run), code, codeRevealed: false } })),
      revealCode: () => set((s) => ({ run: { ...s.run, codeRevealed: true } })),
      bumpCodeAttempts: () => {
        const n = get().run.codeAttempts + 1;
        set((s) => ({ run: { ...started(s.run), codeAttempts: n } }));
        return n;
      },
      unlockBasement: () => set((s) => ({ run: { ...started(s.run), basementUnlocked: true, basementLevel: Math.max(1, s.run.basementLevel) } })),
      enterRoom: (slug, level) =>
        set((s) => ({
          run: {
            ...s.run,
            basementLevel: Math.max(s.run.basementLevel, level),
            basementVisits: s.run.basementVisits + 1,
            roomsVisited: s.run.roomsVisited.includes(slug) ? s.run.roomsVisited : [...s.run.roomsVisited, slug],
            seen: { ...s.run.seen, [`room:${slug}`]: (s.run.seen[`room:${slug}`] ?? 0) + 1 },
          },
        })),
      bumpHideSeek: (patch) =>
        set((s) => {
          const h = s.run.hideSeek;
          return {
            run: {
              ...started(s.run),
              hideSeek: {
                objectsFound: h.objectsFound + (patch.objectsFound ?? 0),
                rocksMoved: h.rocksMoved + (patch.rocksMoved ?? 0),
                gamesCompleted: h.gamesCompleted + (patch.gamesCompleted ?? 0),
                moves: h.moves + (patch.moves ?? 0),
                areasExplored: patch.area && !h.areasExplored.includes(patch.area) ? [...h.areasExplored, patch.area] : h.areasExplored,
                found: patch.found && !h.found.includes(patch.found) ? [...h.found, patch.found] : h.found,
              },
            },
          };
        }),
      recordCrossing: (score) =>
        set((s) => ({
          run: { ...started(s.run), crossing: { crossings: s.run.crossing.crossings + 1, bestScore: Math.max(s.run.crossing.bestScore, score) } },
        })),
      markSeen: (id) => {
        const n = (get().run.seen[id] ?? 0) + 1;
        set((s) => ({ run: { ...s.run, seen: { ...s.run.seen, [id]: n } } }));
        return n;
      },
      resetRun: () => set({ run: emptyRun() }),
      pushMessage: (text, style = "note", ttl = 4200) =>
        set((s) => ({
          messages: [...s.messages.slice(-3), { id: messageSeq++, text, style, ttl }],
        })),
      dismissMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
      glitch: (ms) => set({ glitchUntil: Date.now() + ms }),
      spawn: (kind, count) =>
        set((s) => ({
          spawnedObjects: [
            ...s.spawnedObjects,
            ...Array.from({ length: count }, () => ({
              id: spawnSeq++,
              kind,
              x: 5 + Math.random() * 90,
              y: 5 + Math.random() * 85,
            })),
          ].slice(-30),
        })),
      removeSpawned: (id) => set((s) => ({ spawnedObjects: s.spawnedObjects.filter((o) => o.id !== id) })),
      resetEverything: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: "chei-visitor-v2",
      version: 2,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<VisitorState>;
        return {
          ...current,
          ...p,
          games: { ...current.games, ...(p.games ?? {}) },
          run: {
            ...current.run,
            ...(p.run ?? {}),
            hideSeek: { ...current.run.hideSeek, ...(p.run?.hideSeek ?? {}) },
            crossing: { ...current.run.crossing, ...(p.run?.crossing ?? {}) },
            seen: { ...(p.run?.seen ?? {}) },
          },
        };
      },
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          const raw = localStorage.getItem(key);
          return persistProgress ? raw : stripProgress(raw);
        },
        setItem: (key, value) => {
          if (!canPersist) return;
          localStorage.setItem(key, persistProgress ? value : (stripProgress(value) ?? value));
        },
        removeItem: (key) => localStorage.removeItem(key),
      })),
      skipHydration: true,
      partialize: (s) => {
        const { messages: _m, glitchUntil: _g, spawnedObjects: _s, hydrated: _h, extraEyes: _e, ...rest } = s;
        return rest as VisitorState & VisitorActions;
      },
      onRehydrateStorage: () => (state) => {
        canPersist = true;
        state?.setHydrated();
      },
    },
  ),
);

export const selectDepth = (s: VisitorState) => s.depth;
export const selectEyes = (s: VisitorState) => ({ unlocked: s.eyesUnlocked, count: s.eyeCount });
