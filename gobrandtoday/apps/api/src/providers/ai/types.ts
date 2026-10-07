import { z } from 'zod';
import { FONT_TRIOS, LOGO_STYLES, MARK_SHAPES, NAME_TYPES, SYMBOL_FAMILIES, WORDMARK_CASES, type AssistantReply, type BrandKit, type Brief } from '@gbt/shared';

export type Effort = 'low' | 'medium' | 'high';

export interface NameGenInput {
  brief: Brief;
  count: number;
  feedback?: string;
  refinements?: string[];
  exclude?: string[];
  liked?: string[];
}

export const RawNameSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  nameType: z.enum(NAME_TYPES),
  pronunciation: z.string(),
  personality: z.array(z.string()),
  origin: z.string(),
  relevance: z.number(),
  meaning: z.string(),
  tagline: z.string(),
  whyItWorks: z.array(z.string()),
  watchOut: z.string(),
});
export type RawName = z.infer<typeof RawNameSchema>;
export const NamesOutputSchema = z.object({ names: z.array(RawNameSchema) });

/* ------------------------------ brand kit draft ----------------------------- */

const fontTrioIds = Object.keys(FONT_TRIOS) as [string, ...string[]];

/** A look proposed by the model; contrast-checked palettes are filled in by our system. */
export const DraftLookSchema = z.object({
  title: z.string(),
  concept: z.string(),
  style: z.enum(LOGO_STYLES),
  /** Base hue 0–360. */
  hue: z.number(),
  markShape: z.enum(MARK_SHAPES),
  fontTrio: z.enum(fontTrioIds),
  wordCase: z.enum(WORDMARK_CASES),
  /** A generative family for symbol/emblem looks ("none" otherwise). */
  symbolFamily: z.enum([...SYMBOL_FAMILIES, 'none'] as [string, ...string[]]),
  /** A custom symbol drawn as SVG shapes in a 100×100 box, or "" for none. Sanitised before use. */
  symbolSvg: z.string(),
});
export type DraftLook = z.infer<typeof DraftLookSchema>;

export const IdentityDraftSchema = z.object({
  /** Four very different looks (different styles and hues). */
  looks: z.array(DraftLookSchema),
  essence: z.object({ promise: z.string(), values: z.array(z.object({ name: z.string(), meaning: z.string() })) }),
  /** Four imagery directions: a caption for the guidelines and a prompt for an image model. */
  moodboard: z.array(z.object({ caption: z.string(), prompt: z.string() })),
  designSystem: z.object({
    buttons: z.string(),
    cards: z.string(),
    website: z.string(),
    social: z.string(),
    photography: z.string(),
    illustration: z.string(),
    iconography: z.string(),
    imagery: z.string(),
    spacing: z.string(),
    radius: z.string(),
    personality: z.string(),
  }),
});
export type IdentityDraft = z.infer<typeof IdentityDraftSchema>;

export const StrategyDraftSchema = z.object({
  meaning: z.string(),
  story: z.string(),
  positioning: z.string(),
  mission: z.string(),
  vision: z.string(),
  audience: z.object({ primary: z.string(), secondary: z.string(), insights: z.array(z.string()) }),
  personality: z.array(z.string()),
  archetype: z.object({ name: z.string(), description: z.string() }),
  voice: z.object({ summary: z.string(), say: z.array(z.string()), not: z.array(z.string()), principles: z.array(z.string()) }),
  messaging: z.object({ oneLiner: z.string(), short: z.string(), long: z.string(), elevatorPitch: z.string() }),
});

export const LaunchDraftSchema = z.object({
  bios: z.object({ instagram: z.string(), x: z.string(), linkedin: z.string(), youtube: z.string() }),
  posts: z.object({ instagram: z.string(), linkedin: z.string(), xThread: z.array(z.string()), announcement: z.string() }),
  contentIdeas: z.array(z.string()),
});

export const WebsiteDraftSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  cta: z.string(),
  about: z.string(),
  features: z.array(z.object({ title: z.string(), body: z.string() })),
  benefits: z.array(z.string()),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  contact: z.string(),
  seoTitle: z.string(),
  metaDescription: z.string(),
});

export const KIT_SECTIONS = ['strategy', 'taglines', 'identity', 'launch', 'website'] as const;
export type KitSection = (typeof KIT_SECTIONS)[number];

export const KitDraftSchema = z.object({
  strategy: StrategyDraftSchema,
  taglines: z.array(z.string()),
  identity: IdentityDraftSchema,
  launch: LaunchDraftSchema,
  website: WebsiteDraftSchema,
});
export type KitDraft = z.infer<typeof KitDraftSchema>;

export interface KitGenInput {
  name: string;
  brief: Brief;
  domain?: string;
  handle?: string;
  sections: KitSection[];
  current?: BrandKit;
  /** Extra instruction, e.g. "more premium" when regenerating a section. */
  instruction?: string;
  /** Seed for fresh offline looks ("show me 4 more"). */
  seed?: number;
}

/* -------------------------------- assistant -------------------------------- */

const nullableString = z.string().nullable();
export const AssistantOutputSchema = z.object({
  reply: z.string(),
  names: z.array(z.string()),
  changes: z.object({
    taglines: z.array(z.string()).nullable(),
    positioning: nullableString,
    story: nullableString,
    mission: nullableString,
    vision: nullableString,
    oneLiner: nullableString,
    voiceSummary: nullableString,
    hue: z.number().nullable(),
    darkerPalette: z.boolean().nullable(),
    markShape: z.enum(MARK_SHAPES).nullable(),
    logoStyle: z.enum(LOGO_STYLES).nullable(),
    fontTrio: z.enum(fontTrioIds).nullable(),
    instagramBio: nullableString,
    instagramPost: nullableString,
    linkedinPost: nullableString,
    xThread: z.array(z.string()).nullable(),
    websiteHeadline: nullableString,
    websiteSubheadline: nullableString,
    contentIdeas: z.array(z.string()).nullable(),
  }),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export interface AssistantInput {
  name: string;
  brief: Brief;
  kit: BrandKit;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
}

/* --------------------------------- provider -------------------------------- */

export interface AIProvider {
  readonly id: 'anthropic' | 'openai' | 'offline';
  readonly model?: string;
  /** True when a real model answers. The offline generator is never presented as AI. */
  readonly live: boolean;
  generateNames(input: NameGenInput): Promise<RawName[]>;
  generateKit(input: KitGenInput): Promise<Partial<KitDraft>>;
  assistant(input: AssistantInput): Promise<AssistantOutput>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly reason: 'refusal' | 'truncated' | 'invalid_output' | 'upstream' | 'not_configured',
  ) {
    super(message);
  }
}

export type { AssistantReply };
