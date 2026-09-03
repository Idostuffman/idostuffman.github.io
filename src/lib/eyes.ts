import type { SiteContent } from "@/content/schema";
import { seeded } from "./utils";

export type EyeConfig = SiteContent["eyes"];

export type EyeTier = 0 | 1 | 2 | 3;

export type EyeInputs = {
  depth: number;
  eyeCount: number;
  eyesUnlocked: boolean;
  secretsFound: number;
  totalLosses: number;
  transformThreshold: number;
  extra?: number;
};

export function computeEyeCount(input: EyeInputs, config: EyeConfig): number {
  if (!config.enabled) return 0;
  const depthPart = config.depthCounts[Math.max(0, Math.min(config.depthCounts.length - 1, input.depth))] ?? 0;
  const lossPart = input.eyesUnlocked ? Math.round(input.eyeCount * config.lossWeight) : 0;
  const secretPart = Math.floor(input.secretsFound * config.perSecret);
  const total = depthPart + lossPart + secretPart + (input.extra ?? 0);
  return Math.max(0, Math.min(config.maxEyes, Math.round(total)));
}

export function computeEyeTier(input: EyeInputs): EyeTier {
  let tier = input.depth >= 6 ? 3 : input.depth >= 4 ? 2 : input.depth >= 2 ? 1 : 0;
  if (input.totalLosses >= input.transformThreshold) tier = Math.min(3, tier + 1);
  return tier as EyeTier;
}

export type EyeSpec = {
  id: number;
  x: number;
  y: number;
  big: boolean;
  behind: boolean;
  shy: boolean;
  peek: boolean;
  delay: number;
  period: number;
};

export function layoutEye(i: number, tier: EyeTier): EyeSpec {
  const s = `eye-${i}`;
  const r = (k: string) => seeded(s + k);
  let x: number;
  let y: number;
  if (i < 4) {
    x = i % 2 === 0 ? 1 + r("x") * 6 : 91 + r("x") * 6;
    y = i < 2 ? 2 + r("y") * 8 : 84 + r("y") * 9;
  } else if (i < 12) {
    const side = Math.floor(r("s") * 4);
    if (side === 0) {
      x = r("x") * 100;
      y = 1 + r("y") * 6;
    } else if (side === 1) {
      x = 92 + r("x") * 7;
      y = r("y") * 100;
    } else if (side === 2) {
      x = r("x") * 100;
      y = 88 + r("y") * 8;
    } else {
      x = 1 + r("x") * 7;
      y = r("y") * 100;
    }
  } else {
    x = 2 + r("x") * 94;
    y = 2 + r("y") * 92;
    if (tier === 3 && r("o") > 0.8) {
      x = r("o2") > 0.5 ? -2 : 98;
    }
  }
  return {
    id: i,
    x,
    y,
    big: tier >= 2 && r("b") > 0.7,
    behind: tier >= 1 && i % 3 === 1,
    shy: tier <= 1 && i < 6,
    peek: tier >= 2 && i >= 4 && r("p") > 0.72,
    delay: r("d") * 9,
    period: 5 + r("q") * 6,
  };
}

export function layoutEyes(count: number, tier: EyeTier): EyeSpec[] {
  const out: EyeSpec[] = [];
  for (let i = 0; i < count; i++) out.push(layoutEye(i, tier));
  return out;
}
