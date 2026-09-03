"use client";

export type SiteEvents = {
  "game:result": { game: string; result: "win" | "loss"; totalLosses: number; consecutiveLosses: number };
  "interaction:fired": { id: string };
  "secret:unlocked": { id: string };
  "depth:changed": { from: number; to: number };
  "fragment:found": { id: string };
  "item:found": { id: string };
  "key:assembled": { fragments: number };
};

type Handler<K extends keyof SiteEvents> = (payload: SiteEvents[K]) => void;

const handlers = new Map<keyof SiteEvents, Set<Handler<keyof SiteEvents>>>();

export function on<K extends keyof SiteEvents>(name: K, handler: Handler<K>): () => void {
  let set = handlers.get(name);
  if (!set) {
    set = new Set();
    handlers.set(name, set);
  }
  const h = handler as unknown as Handler<keyof SiteEvents>;
  set.add(h);
  return () => set.delete(h);
}

export function emit<K extends keyof SiteEvents>(name: K, payload: SiteEvents[K]) {
  handlers.get(name)?.forEach((h) => {
    try {
      (h as unknown as Handler<K>)(payload);
    } catch (err) {
      console.error(`[events] handler for ${name} failed`, err);
    }
  });
}
