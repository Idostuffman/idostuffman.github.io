"use client";

import type { Interaction, InteractionAction, InteractionConditions, SiteContent } from "@/content/schema";
import { useVisitor, type VisitorActions, type VisitorState } from "@/state/visitorStore";
import { playSound } from "@/lib/sound";
import { emit } from "./events";

type Store = VisitorState & VisitorActions;

export type ActionContext = {
  content: SiteContent;
  navigate: (to: string) => void;
};

export function conditionsMet(c: InteractionConditions | undefined, s: Store): boolean {
  if (!c) return true;
  if (c.minDepth !== undefined && s.depth < c.minDepth) return false;
  if (c.maxDepth !== undefined && s.depth > c.maxDepth) return false;
  if (c.requiresSecret && !s.discoveredSecrets.includes(c.requiresSecret)) return false;
  if (c.requiresFlag && !s.flags[c.requiresFlag]) return false;
  if (c.eyesUnlocked !== undefined && s.eyesUnlocked !== c.eyesUnlocked) return false;
  return true;
}

export function unlockSecret(id: string, content: SiteContent, s: Store): boolean {
  const secret = content.secrets.find((x) => x.id === id || x.slug === id);
  if (!secret) return false;
  const isNew = s.discoverSecret(secret.id);
  if (isNew) {
    if (secret.depthGain) s.addDepth(secret.depthGain);
    s.pushMessage(secret.unlockMessage || "you found something", "whisper", 5000);
    emit("secret:unlocked", { id: secret.id });
  }
  return isNew;
}

export function runAction(action: InteractionAction, ctx: ActionContext) {
  const s = useVisitor.getState();
  switch (action.type) {
    case "depth": {
      const from = s.depth;
      s.addDepth(action.amount);
      emit("depth:changed", { from, to: useVisitor.getState().depth });
      break;
    }
    case "setDepth": {
      const from = s.depth;
      s.setDepth(action.depth);
      emit("depth:changed", { from, to: useVisitor.getState().depth });
      break;
    }
    case "unlockSecret":
      unlockSecret(action.secret, ctx.content, s);
      break;
    case "navigate":
      ctx.navigate(action.to);
      break;
    case "message":
      s.pushMessage(action.text, action.style);
      break;
    case "reveal":
      s.reveal(action.target);
      break;
    case "hide":
      s.hide(action.target);
      break;
    case "setText":
      s.setText(action.target, action.text);
      break;
    case "setImage":
      s.setImage(action.target, action.src);
      break;
    case "flag":
      s.setFlag(action.key, action.value);
      break;
    case "spawn":
      if (action.object === "eye") s.addEyes(action.count);
      else s.spawn(action.object, action.count);
      break;
    case "glitch":
      s.glitch(action.ms);
      break;
    case "sound":
      playSound(action.name);
      break;
  }
}

export function fireInteraction(interaction: Interaction, ctx: ActionContext): boolean {
  const s = useVisitor.getState();
  if (!interaction.enabled) return false;
  if (interaction.once && s.firedInteractions.includes(interaction.id)) return false;
  if (!conditionsMet(interaction.conditions, s)) return false;

  const count = s.bumpInteraction(interaction.id);
  if (count < interaction.trigger.count) return false;

  if (interaction.once) s.markFired(interaction.id);
  else s.resetInteraction(interaction.id);
  s.bumpSpecial();

  for (const action of interaction.actions) {
    try {
      runAction(action, ctx);
    } catch (err) {
      console.error(`[interactions] action failed in ${interaction.id}`, err);
    }
  }
  emit("interaction:fired", { id: interaction.id });
  return true;
}
