"use client";

import type { Item, KeyFragment, Requirement, SiteContent } from "@/content/schema";
import { useVisitor, type GameId, type VisitorState } from "@/state/visitorStore";
import { playSound } from "@/lib/sound";
import { emit } from "@/interactions/events";


export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const c = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `${c[0]}${c[1]}-${c[2]}${c[3]}-${c[4]}${c[5]}`;
}

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");


export type Facts = {
  wins?: number;
  score?: number;
  clicks?: number;
  crossings?: number;
  dodges?: number;
  itemId?: string;
};

export function requiredCount(content: SiteContent): number {
  const n = content.progression.requiredFragments;
  return n > 0 ? Math.min(n, content.progression.fragments.length) : content.progression.fragments.length;
}

export function meetsRequirement(req: Requirement, facts: Facts): boolean {
  if (req.type === "item") return !!req.itemId && facts.itemId === req.itemId;
  const v = facts[req.type];
  return typeof v === "number" && v >= req.value;
}

export function fragmentsCollected(s: VisitorState): number {
  return s.run.fragments.length;
}

export function keyComplete(content: SiteContent, s: VisitorState): boolean {
  return fragmentsCollected(s) >= requiredCount(content) && requiredCount(content) > 0;
}

export function maybeAssembleKey(content: SiteContent) {
  const s = useVisitor.getState();
  if (s.run.code || !keyComplete(content, s)) return;
  s.setRunCode(generateCode());
  s.pushMessage(content.progression.messages.allFragments, "glitch", 6000);
  playSound("hum");
  emit("key:assembled", { fragments: s.run.fragments.length });
}

export function checkRewards(content: SiteContent, game: GameId, facts: Facts): { fragments: KeyFragment[]; items: Item[] } {
  const s = useVisitor.getState();
  const got: { fragments: KeyFragment[]; items: Item[] } = { fragments: [], items: [] };

  for (const f of content.progression.fragments) {
    if (f.game !== game || s.run.fragments.includes(f.id)) continue;
    if (!meetsRequirement(f.requirement, facts)) continue;
    if (s.collectFragment(f.id)) {
      got.fragments.push(f);
      s.pushMessage(`${content.progression.messages.fragmentFound} (${f.name})`, "glitch", 5000);
      playSound("glitch");
      emit("fragment:found", { id: f.id });
    }
  }

  for (const it of content.progression.items) {
    if (it.location.game !== game || !it.requirement || s.run.inventory.includes(it.id)) continue;
    if (!meetsRequirement(it.requirement, facts)) continue;
    if (collectItemById(content, it.id, { silentFragment: true })) got.items.push(it);
  }

  maybeAssembleKey(content);
  return got;
}

export function collectItemById(content: SiteContent, id: string, opts: { silentFragment?: boolean } = {}): boolean {
  const item = content.progression.items.find((i) => i.id === id);
  if (!item) return false;
  const s = useVisitor.getState();
  if (!s.collectItem(item.id)) return false;
  s.pushMessage(`${content.progression.messages.itemFound}: ${item.name}`, "note", 3500);
  playSound("pop");
  emit("item:found", { id: item.id });
  if (item.fragmentId) {
    const frag = content.progression.fragments.find((f) => f.id === item.fragmentId);
    if (frag && s.collectFragment(frag.id)) {
      if (!opts.silentFragment) s.pushMessage(`${content.progression.messages.fragmentFound} (${frag.name})`, "glitch", 5000);
      playSound("glitch");
      emit("fragment:found", { id: frag.id });
    }
    maybeAssembleKey(content);
  }
  return true;
}


export function effectiveDepth(s: VisitorState): number {
  const earned = Math.floor(s.run.hideSeek.objectsFound / 3) + s.run.fragments.length;
  const base = Math.max(s.depth, Math.min(6, earned));
  return Math.max(0, Math.min(9, base + (s.run.basementUnlocked ? 2 : 0)));
}

export function placedItems(content: SiteContent, areaId: string, eff: number): Map<string, Item> {
  const map = new Map<string, Item>();
  for (const it of content.progression.items) {
    if (it.location.game !== "hideseek" || it.location.area !== areaId || !it.location.cell) continue;
    if (it.depthRequired > eff) continue;
    const prev = map.get(it.location.cell);
    if (!prev || it.depthRequired >= prev.depthRequired) map.set(it.location.cell, it);
  }
  return map;
}

export function renderText(text: string, s: VisitorState, name = ""): string {
  return text
    .replace(/\[found\]/g, String(s.run.hideSeek.objectsFound))
    .replace(/\[rocks\]/g, String(s.run.hideSeek.rocksMoved))
    .replace(/\[fragments\]/g, String(s.run.fragments.length))
    .replace(/\[visits\]/g, String(s.run.basementVisits))
    .replace(/\[moves\]/g, String(s.run.hideSeek.moves))
    .replace(/\[losses\]/g, String(s.totalLosses))
    .replace(/\[name\]/g, name);
}

export function describeItem(item: Item, s: VisitorState, name = ""): string {
  const seen = s.run.seen[item.id] ?? 0;
  const text = seen > 1 && item.laterDescription ? item.laterDescription : item.description;
  return renderText(text, s, name);
}
