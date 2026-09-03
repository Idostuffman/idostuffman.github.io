import { z } from "zod";

const id = z.string().min(1).max(80);
const shortText = z.string().max(300);
const longText = z.string().max(20000);
const url = z.string().max(2000);

export const SocialLinkSchema = z.object({
  id,
  label: shortText,
  url,
  icon: z.string().max(8).optional().default(""),
});

export const IdentitySchema = z.object({
  name: shortText.default("Chei"),
  username: shortText.default("@chei"),
  pronouns: shortText.default(""),
  siteTitle: shortText.default("chei's website"),
  tagline: shortText.default("[SHORT DESCRIPTION]"),
  welcome: longText.default("hi :3\nwelcome to my website"),
  avatar: url.default("/placeholders/avatar.svg"),
  deepTitle: shortText.default("chei's website?"),
});

export const BioLayerKindSchema = z.enum([
  "custom",
  "who",
  "personality",
  "likes",
  "dislikes",
  "interests",
  "habits",
  "facts",
  "thoughts",
]);
export type BioLayerKind = z.infer<typeof BioLayerKindSchema>;

export type BioLayer = {
  id: string;
  title: string;
  body: string;
  kind?: BioLayerKind;
  prompt?: string;
  minDepth?: number;
  depthGain?: number;
  children?: BioLayer[];
};

export const BioLayerSchema: z.ZodType<BioLayer> = z.lazy(() =>
  z.object({
    id,
    title: shortText,
    body: longText,
    kind: BioLayerKindSchema.optional(),
    prompt: shortText.optional(),
    minDepth: z.number().int().min(0).max(9).optional(),
    depthGain: z.number().int().min(0).max(3).optional(),
    children: z.array(BioLayerSchema).optional(),
  }),
);

export const PersonalityTraitSchema = z.object({
  id,
  trait: shortText,
  description: longText,
  intensity: z.number().int().min(1).max(5).default(3),
  hidden: z.boolean().default(false),
});

export const InterestSchema = z.object({
  id,
  title: shortText,
  description: longText,
  image: url.optional().default(""),
  tags: z.array(shortText).default([]),
  rating: z.number().int().min(1).max(5).default(3),
  hiddenContent: longText.optional().default(""),
});

export const DislikeSchema = z.object({ id, text: shortText, reason: longText.optional().default("") });

export const RandomFactSchema = z.object({ id, text: longText, minDepth: z.number().int().min(0).max(9).default(0) });

export const ArtCategorySchema = z.object({ id, label: shortText });

export const ArtworkHiddenSchema = z.object({
  type: z.enum(["none", "alt-image", "text", "link"]).default("none"),
  image: url.optional().default(""),
  text: longText.optional().default(""),
  href: url.optional().default(""),
  clicks: z.number().int().min(1).max(50).default(3),
  depthGain: z.number().int().min(0).max(3).default(1),
});

export const ArtworkSchema = z.object({
  id,
  title: shortText,
  image: url,
  description: longText.default(""),
  date: shortText.default(""),
  category: id,
  tags: z.array(shortText).default([]),
  commissionStatus: z.enum(["personal", "commission", "example"]).default("personal"),
  hidden: ArtworkHiddenSchema.prefault({}),
});

export const CommissionTypeSchema = z.object({
  id,
  name: shortText,
  price: shortText,
  description: longText,
  examples: z.array(id).default([]),
  available: z.boolean().default(true),
});

export const CommissionsSchema = z.object({
  headline: shortText.default("Commissions"),
  intro: longText.default("[COMMISSION INFORMATION]"),
  status: z.enum(["open", "limited", "closed"]).default("open"),
  statusNote: shortText.default(""),
  types: z.array(CommissionTypeSchema).default([]),
  process: z.array(longText).default([]),
  terms: z.array(longText).default([]),
  turnaround: shortText.default(""),
  contact: z
    .object({ method: shortText, value: shortText, note: shortText.default("") })
    .default({ method: "Email", value: "[EMAIL]", note: "" }),
  gallery: z.array(id).default([]),
  faq: z.array(z.object({ id, q: shortText, a: longText })).default([]),
});

export const CrossingSchema = z.object({
  cols: z.number().int().min(5).max(15).default(9),
  startLanes: z.number().int().min(1).max(10).default(4),
  maxLanes: z.number().int().min(1).max(12).default(8),
  baseSpeed: z.number().min(0.2).max(10).default(1.6),
  speedStep: z.number().min(0).max(5).default(0.35),
  spawnGap: z.number().min(0.5).max(10).default(3.2),
  minGap: z.number().min(0.5).max(10).default(1.7),
  winCrossings: z.number().int().min(1).max(50).default(3),
  weirdFrom: z.number().int().min(0).max(50).default(2),
});

export const GameSettingsSchema = z.object({
  lossMessages: z.array(shortText).default([]),
  eyeThreshold: z.number().int().min(1).max(100).default(3),
  transformThreshold: z.number().int().min(1).max(200).default(8),
  reaction: z
    .object({
      rounds: z.number().int().min(1).max(20).default(5),
      windowMs: z.number().int().min(150).max(3000).default(600),
    })
    .prefault({}),
  memory: z
    .object({
      startLength: z.number().int().min(1).max(10).default(3),
      winLength: z.number().int().min(2).max(30).default(7),
    })
    .prefault({}),
  clicker: z
    .object({
      milestones: z.array(z.object({ at: z.number().int().min(1), text: shortText })).default([]),
      moveAt: z.number().int().min(1).max(10000).default(300),
      resetOnMiss: z.boolean().default(true),
    })
    .prefault({}),
  crossing: CrossingSchema.prefault({}),
  impossible: z
    .object({
      label: shortText.default("click me"),
      fleeDistance: z.number().int().min(40).max(400).default(140),
      catchableAfter: z.number().int().min(1).max(200).default(25),
    })
    .prefault({}),
});

export const TriggerSchema = z.object({
  type: z.enum([
    "click",
    "dblclick",
    "hover",
    "longpress",
    "keys",
    "visit",
    "visits",
    "depth",
    "gameloss",
    "scroll",
    "idle",
  ]),
  target: z.string().max(200).default(""),
  count: z.number().int().min(1).max(1000).default(1),
});

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("depth"), amount: z.number().int().min(-9).max(9).default(1) }),
  z.object({ type: z.literal("setDepth"), depth: z.number().int().min(0).max(9) }),
  z.object({ type: z.literal("unlockSecret"), secret: id }),
  z.object({ type: z.literal("navigate"), to: url }),
  z.object({
    type: z.literal("message"),
    text: longText,
    style: z.enum(["note", "whisper", "system", "glitch"]).default("note"),
  }),
  z.object({ type: z.literal("reveal"), target: id }),
  z.object({ type: z.literal("hide"), target: id }),
  z.object({ type: z.literal("setText"), target: id, text: longText }),
  z.object({ type: z.literal("setImage"), target: id, src: url }),
  z.object({ type: z.literal("flag"), key: id, value: z.boolean().default(true) }),
  z.object({
    type: z.literal("spawn"),
    object: z.enum(["eye", "sticker", "window"]),
    count: z.number().int().min(1).max(20).default(1),
  }),
  z.object({ type: z.literal("glitch"), ms: z.number().int().min(50).max(5000).default(400) }),
  z.object({
    type: z.literal("sound"),
    name: z.enum(["click", "blip", "glitch", "hum", "pop", "wrong", "win"]),
  }),
]);

export const ConditionsSchema = z.object({
  minDepth: z.number().int().min(0).max(9).optional(),
  maxDepth: z.number().int().min(0).max(9).optional(),
  requiresSecret: id.optional(),
  requiresFlag: id.optional(),
  eyesUnlocked: z.boolean().optional(),
});

export const InteractionSchema = z.object({
  id,
  note: shortText.default(""),
  trigger: TriggerSchema,
  conditions: ConditionsSchema.prefault({}),
  actions: z.array(ActionSchema).default([]),
  once: z.boolean().default(true),
  enabled: z.boolean().default(true),
});

export const SecretSchema = z.object({
  id,
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(60),
  title: shortText,
  body: longText,
  style: z.enum(["note", "terminal", "void", "shrine", "notice", "window"]).default("note"),
  urlUnlockable: z.boolean().default(false),
  depthGain: z.number().int().min(0).max(3).default(1),
  leadsTo: z.array(id).default([]),
  unlockMessage: shortText.default("you found something"),
});

export const DepthLevelSchema = z.object({
  depth: z.number().int().min(0).max(9),
  name: shortText,
  note: shortText.default(""),
  backgroundWords: z.array(longText).default([]),
  whispers: z.array(longText).default([]),
  title: shortText.optional(),
});

export const FontKeySchema = z.enum(["sans", "serif", "hand", "mono", "pixel", "display"]);

export const ThemeSchema = z.object({
  paper: z.string().max(40).default("#f6efe2"),
  ink: z.string().max(40).default("#2b2118"),
  accent: z.string().max(40).default("#ff6fa8"),
  accent2: z.string().max(40).default("#b6ff3b"),
  accent3: z.string().max(40).default("#5b8cff"),
  bodyFont: FontKeySchema.default("sans"),
  headingFont: FontKeySchema.default("display"),
  normalAccent: z.string().max(40).default("#2f5d62"),
});

export const SettingsSchema = z.object({
  persistProgress: z.boolean().default(false),
  startDepth: z.number().int().min(0).max(7).default(0),
  stagePickerPublic: z.boolean().default(false),
});

export const EyesSchema = z.object({
  enabled: z.boolean().default(true),
  depthCounts: z.array(z.number().int().min(0).max(100)).default([0, 1, 3, 5, 8, 14, 22, 34, 44, 60]),
  lossWeight: z.number().min(0).max(5).default(1),
  perSecret: z.number().min(0).max(5).default(0.5),
  maxEyes: z.number().int().min(0).max(150).default(48),
  shyRadius: z.number().int().min(0).max(600).default(140),
});

export const StickerSchema = z.object({
  id,
  content: shortText,
  image: url.optional().default(""),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  rotate: z.number().min(-180).max(180).default(0),
  size: z.number().min(0.5).max(6).default(1.6),
  target: id.optional(),
  says: shortText.optional().default(""),
  draggable: z.boolean().default(true),
  hideOnMobile: z.boolean().default(false),
});


export const GameIdSchema = z.enum(["reaction", "memory", "clicker", "hideseek", "impossible", "crossing"]);

export const RequirementSchema = z.object({
  type: z.enum(["wins", "score", "clicks", "crossings", "dodges", "item"]),
  value: z.number().int().min(0).default(1),
  itemId: id.optional(),
});

export const KeyFragmentSchema = z.object({
  id,
  name: shortText,
  description: longText.default(""),
  game: GameIdSchema,
  requirement: RequirementSchema,
  location: shortText.default(""),
  hint: shortText.default(""),
});

export const ItemSchema = z.object({
  id,
  name: shortText,
  description: longText.default(""),
  laterDescription: longText.default(""),
  icon: shortText.default("?"),
  image: url.optional().default(""),
  depthRequired: z.number().int().min(0).max(9).default(0),
  location: z
    .object({
      game: z.enum(["hideseek", "crossing", "impossible", "clicker", "reaction", "memory", "basement", "none"]).default("none"),
      area: id.optional(),
      cell: z.string().max(10).optional(),
      under: z.enum(["dirt", "rock", "bush"]).default("dirt"),
      room: id.optional(),
    })
    .prefault({}),
  discoveryMethod: z.enum(["find", "reward", "pickup"]).default("find"),
  rarity: z.enum(["common", "uncommon", "rare", "???"]).default("common"),
  behavior: z.enum(["static", "twitch", "watch", "vanish", "changed"]).default("static"),
  hidden: z.boolean().default(true),
  fragmentId: id.optional(),
  requirement: RequirementSchema.optional(),
});

export const HideSeekAreaSchema = z.object({
  id,
  name: shortText,
  layout: z.array(z.string().max(40)).min(2),
  depthRequired: z.number().int().min(0).max(9).default(0),
  intro: shortText.default(""),
});

export const DoorSchema = z.object({
  title: shortText.default("ACCESS · B"),
  prompt: shortText.default("insert key"),
  noKeyText: shortText.default("no key. the door is patient."),
  wrongMessages: z.array(shortText).default(["no.", "that isn't it.", "you're guessing."]),
  successText: shortText.default("…yes. come in."),
  hint: shortText.default("the code is on the back of the note."),
  hintAfter: shortText.default("the games have the pieces. the pocket has the note."),
});

export const ProgressionSchema = z.object({
  requiredFragments: z.number().int().min(0).max(20).default(0),
  fragments: z.array(KeyFragmentSchema).default([]),
  items: z.array(ItemSchema).default([]),
  hideSeek: z
    .object({
      areas: z.array(HideSeekAreaSchema).default([]),
      moveBudget: z.number().int().min(20).max(1000).default(140),
      bushHits: z.number().int().min(1).max(10).default(3),
    })
    .prefault({}),
  door: DoorSchema.prefault({}),
  messages: z
    .object({
      fragmentFound: shortText.default("something clicked into place"),
      allFragments: shortText.default("the pieces are warm. look in your pocket."),
      itemFound: shortText.default("found"),
      noteBack: longText.default("on the back, in pencil: the door is under the about page. it wants this."),
      pocketHint: shortText.default("the games have pieces of something."),
    })
    .prefault({}),
});


export const BasementLabelSchema = z.object({
  id,
  text: shortText,
  to: z.string().max(200).default(""),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  behavior: z.enum(["normal", "flee", "flicker", "wrong", "corrupt"]).default("normal"),
  really: z.string().max(200).optional(),
});

export const BasementObjectSchema = z.object({
  id,
  kind: z.enum(["chair", "door", "lamp", "wall-text", "stain", "window", "eye", "object"]).default("object"),
  text: longText.default(""),
  later: longText.default(""),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(0.3).max(4).default(1),
  itemId: id.optional(),
  to: z.string().max(200).optional(),
});

export const BasementRoomSchema = z.object({
  id,
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(60),
  title: shortText.default(""),
  level: z.number().int().min(1).max(3).default(1),
  body: longText.default(""),
  later: longText.default(""),
  labels: z.array(BasementLabelSchema).default([]),
  objects: z.array(BasementObjectSchema).default([]),
  light: z.enum(["lamp", "dim", "none", "flicker"]).default("lamp"),
  tint: z.string().max(40).default(""),
});

export const BasementEyesSchema = z.object({
  intervals: z
    .array(z.object({ min: z.number().min(1).max(600), max: z.number().min(1).max(600) }))
    .default([
      { min: 18, max: 50 },
      { min: 9, max: 26 },
      { min: 4, max: 12 },
    ]),
  maxVisible: z.number().int().min(0).max(12).default(4),
  followChance: z.number().min(0).max(1).default(0.35),
  flashChance: z.number().min(0).max(1).default(0.3),
  lookChance: z.number().min(0).max(1).default(0.35),
  hideRadius: z.number().int().min(0).max(600).default(150),
});

export const BasementSchema = z.object({
  title: shortText.default("…"),
  rooms: z.array(BasementRoomSchema).default([]),
  eyes: BasementEyesSchema.prefault({}),
  noise: z.number().min(0).max(1).default(0.5),
});

export const SiteContentSchema = z.object({
  version: z.number().int().default(1),
  identity: IdentitySchema.prefault({}),
  socials: z.array(SocialLinkSchema).default([]),
  bio: z
    .object({
      short: longText.default("[CHEI BIO GOES HERE]"),
      layers: z.array(BioLayerSchema).default([]),
    })
    .prefault({}),
  personality: z
    .object({
      intro: longText.default("[PERSONALITY DESCRIPTION]"),
      traits: z.array(PersonalityTraitSchema).default([]),
      layers: z.array(z.object({ id, title: shortText, body: longText })).default([]),
    })
    .prefault({}),
  interests: z.array(InterestSchema).default([]),
  dislikes: z.array(DislikeSchema).default([]),
  facts: z.array(RandomFactSchema).default([]),
  thoughts: z.array(RandomFactSchema).default([]),
  art: z
    .object({
      intro: longText.default(""),
      categories: z.array(ArtCategorySchema).default([]),
      works: z.array(ArtworkSchema).default([]),
    })
    .prefault({}),
  commissions: CommissionsSchema.prefault({}),
  games: GameSettingsSchema.prefault({}),
  interactions: z.array(InteractionSchema).default([]),
  secrets: z.array(SecretSchema).default([]),
  deepLevels: z.array(DepthLevelSchema).default([]),
  theme: ThemeSchema.prefault({}),
  eyes: EyesSchema.prefault({}),
  settings: SettingsSchema.prefault({}),
  progression: ProgressionSchema.prefault({}),
  basement: BasementSchema.prefault({}),
  stickers: z.array(StickerSchema).default([]),
  strings: z.record(z.string(), longText).prefault({}),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;
export type Identity = z.infer<typeof IdentitySchema>;
export type PersonalityTrait = z.infer<typeof PersonalityTraitSchema>;
export type Interest = z.infer<typeof InterestSchema>;
export type Artwork = z.infer<typeof ArtworkSchema>;
export type ArtCategory = z.infer<typeof ArtCategorySchema>;
export type Commissions = z.infer<typeof CommissionsSchema>;
export type CommissionType = z.infer<typeof CommissionTypeSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type InteractionAction = z.infer<typeof ActionSchema>;
export type InteractionTrigger = z.infer<typeof TriggerSchema>;
export type InteractionConditions = z.infer<typeof ConditionsSchema>;
export type Secret = z.infer<typeof SecretSchema>;
export type DepthLevel = z.infer<typeof DepthLevelSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type FontKey = z.infer<typeof FontKeySchema>;
export type Sticker = z.infer<typeof StickerSchema>;
export type EyesConfig = z.infer<typeof EyesSchema>;
export type SiteSettings = z.infer<typeof SettingsSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type KeyFragment = z.infer<typeof KeyFragmentSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type HideSeekArea = z.infer<typeof HideSeekAreaSchema>;
export type BasementLabel = z.infer<typeof BasementLabelSchema>;
export type BasementObject = z.infer<typeof BasementObjectSchema>;
export type BasementRoom = z.infer<typeof BasementRoomSchema>;
export type BasementEyes = z.infer<typeof BasementEyesSchema>;
export type CrossingSettings = z.infer<typeof CrossingSchema>;

export function parseContent(input: unknown): SiteContent {
  return SiteContentSchema.parse(input);
}

export function safeParseContent(input: unknown) {
  return SiteContentSchema.safeParse(input);
}
