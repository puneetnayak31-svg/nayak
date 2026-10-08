import { z } from 'zod';
import { NAME_MODES, SOCIAL_PLATFORM_IDS } from './options';

const modeIds = NAME_MODES.map((m) => m.id) as [string, ...string[]];

/* ------------------------------------------------------------------ */
/* Brief                                                               */
/* ------------------------------------------------------------------ */

export const ConstraintsSchema = z
  .object({
    maxLength: z.number().int().min(3).max(20).optional(),
    startsWith: z
      .string()
      .regex(/^[a-zA-Z]{0,3}$/)
      .optional(),
    avoidLetters: z
      .string()
      .regex(/^[a-zA-Z]{0,10}$/)
      .optional(),
    mustInclude: z.string().max(20).optional(),
  })
  .partial();
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const BriefSchema = z.object({
  description: z.string().trim().min(2, 'Tell us a little about your idea').max(800),
  industry: z.string().max(40).optional(),
  audience: z.string().max(200).optional(),
  geography: z.string().max(60).optional(),
  personalities: z.array(z.string().max(30)).max(6).default([]),
  styles: z.array(z.string().max(30)).max(8).default([]),
  tlds: z
    .array(z.string().regex(/^[a-z]{2,10}(\.[a-z]{2,4})?$/))
    .max(8)
    .default(['com', 'in', 'ai']),
  mode: z.enum(modeIds).default('smart'),
  constraints: ConstraintsSchema.optional(),
});
export type Brief = z.infer<typeof BriefSchema>;

export const GenerateNamesRequestSchema = z.object({
  brief: BriefSchema,
  count: z.number().int().min(4).max(40).default(18),
  /** Free-text feedback: "too corporate", "make them feel like chai". */
  feedback: z.string().max(400).optional(),
  refinements: z.array(z.string().max(40)).max(6).optional(),
  /** Names already shown, so a refinement round never repeats itself. */
  exclude: z.array(z.string().max(40)).max(200).optional(),
  /** Names the user liked — a refinement leans towards them. */
  liked: z.array(z.string().max(40)).max(20).optional(),
  projectId: z.string().uuid().optional(),
});
export type GenerateNamesRequest = z.infer<typeof GenerateNamesRequestSchema>;

/* ------------------------------------------------------------------ */
/* Names & scores                                                      */
/* ------------------------------------------------------------------ */

export const NAME_TYPES = [
  'invented',
  'compound',
  'blend',
  'real_word',
  'descriptive',
  'indian',
  'abstract',
  'founder',
] as const;
export type NameType = (typeof NAME_TYPES)[number];

export type ScoreKey =
  | 'brandability'
  | 'memorability'
  | 'pronunciation'
  | 'distinctiveness'
  | 'global'
  | 'seo'
  | 'domain'
  | 'social';

export interface ScoreComponent {
  key: ScoreKey;
  label: string;
  /** 0–10, one decimal. Null while the input (e.g. domain check) is pending. */
  value: number | null;
  weight: number;
  note: string;
}

export interface RiskFlag {
  level: 'info' | 'warn' | 'high';
  message: string;
}

export interface GoBrandScore {
  /** 0–100 internal score. */
  overall100: number;
  /** 0–10 display score, one decimal. */
  overall: number;
  /** True while domain/social checks haven't run — score is re-weighted without them. */
  provisional: boolean;
  components: ScoreComponent[];
  seo: { value: number; explanation: string };
  risks: RiskFlag[];
  version: string;
}

export interface NameCandidate {
  id: string;
  name: string;
  rationale: string;
  nameType: NameType;
  pronunciation: string;
  personality: string[];
  origin?: string;
  /** 0–10, how well the name fits the brief (AI judgement or keyword overlap). */
  relevance: number;
  /** A ready-to-use tagline written for this name. */
  tagline?: string;
  /** What the name means or evokes, in plain words. */
  meaning?: string;
  /** Two or three concrete reasons it works for this brief. */
  whyItWorks?: string[];
  /** One honest caveat (spelling, a crowded space, a similar brand). */
  watchOut?: string;
  source: 'ai' | 'offline' | 'user';
  score: GoBrandScore;
  domains?: DomainResult[];
  socials?: SocialResult[];
}

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* ------------------------------------------------------------------ */

export type DomainStatus = 'available' | 'taken' | 'premium' | 'unknown' | 'invalid';
export type DomainSource = 'rdap' | 'godaddy' | 'hostinger' | 'namecheap' | 'porkbun' | 'namecom' | 'dns' | 'demo';

export interface BuyLink {
  registrar: string;
  label: string;
  url: string;
}

export interface DomainResult {
  domain: string;
  tld: string;
  status: DomainStatus;
  source: DomainSource;
  /** Only true when a registry/registrar API confirmed the status. Demo is never verified. */
  verified: boolean;
  /**
   * True when a registrar (not just the registry) confirmed it can be bought
   * right now. Registry-only "available" can still be reserved or premium.
   */
  confirmed?: boolean;
  /** Live price from a registrar API. Estimates are computed client-side and labelled "est.". */
  price?: { amount: number; currency: string; renewal?: number };
  note?: string;
  checkedAt: string;
  buyLinks: BuyLink[];
}

export const DomainCheckRequestSchema = z.object({
  name: z.string().trim().min(1).max(63),
  tlds: z
    .array(z.string().regex(/^[a-z]{2,10}(\.[a-z]{2,4})?$/))
    .min(1)
    .max(10)
    .default(['com', 'in', 'ai', 'io', 'co']),
  region: z.enum(['IN', 'US']).default('IN'),
});

export const DomainBulkRequestSchema = z.object({
  names: z.array(z.string().trim().min(1).max(63)).min(1).max(12),
  tlds: z
    .array(z.string().regex(/^[a-z]{2,10}(\.[a-z]{2,4})?$/))
    .min(1)
    .max(8)
    .default(['com', 'in', 'ai']),
  region: z.enum(['IN', 'US']).default('IN'),
});

/* ------------------------------------------------------------------ */
/* Social                                                              */
/* ------------------------------------------------------------------ */

export type SocialStatus = 'available' | 'taken' | 'unknown' | 'invalid' | 'manual';
export type SocialMethod = 'official_api' | 'public_endpoint' | 'profile_probe' | 'manual' | 'demo';

export interface SocialResult {
  platform: string;
  handle: string;
  status: SocialStatus;
  method: SocialMethod;
  verified: boolean;
  url: string;
  note?: string;
  checkedAt: string;
}

export interface HandleSuggestion {
  handle: string;
  /** Platforms where this alternative was verified available. */
  verifiedOn: string[];
  /** Always true until verified somewhere — we never present these as available. */
  suggestion: boolean;
}

const platformEnum = z.enum(SOCIAL_PLATFORM_IDS as [string, ...string[]]);

export const SocialCheckRequestSchema = z.object({
  handle: z.string().trim().min(1).max(40),
  platforms: z.array(platformEnum).min(1).max(10).optional(),
  alternatives: z.boolean().default(true),
});

export const SocialBulkRequestSchema = z.object({
  handles: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
  platforms: z.array(platformEnum).min(1).max(10).optional(),
});

/* ------------------------------------------------------------------ */
/* Brand kit (the "Brand Bible")                                       */
/* ------------------------------------------------------------------ */

export const MARK_SHAPES = [
  'spark',
  'dot',
  'diamond',
  'leaf',
  'petal',
  'drop',
  'flame',
  'bolt',
  'heart',
  'ring',
  'square',
  'sun',
  'wave',
  'arc',
] as const;
export type MarkShape = (typeof MARK_SHAPES)[number];

export const LOGO_STYLES = ['twinkle', 'monogram', 'editorial', 'stacked', 'symbol', 'emblem', 'lettermark', 'playful', 'terminal', 'heritage'] as const;
export type LogoStyle = (typeof LOGO_STYLES)[number];

export const PALETTE_ROLES = ['ink', 'brand', 'accent', 'tint', 'paper'] as const;
export type PaletteRole = (typeof PALETTE_ROLES)[number];

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const PaletteSwatchSchema = z.object({
  role: z.enum(PALETTE_ROLES),
  name: z.string().max(40),
  hex,
  usage: z.string().max(120),
});
export type PaletteSwatch = z.infer<typeof PaletteSwatchSchema>;

export const FontChoiceSchema = z.object({
  family: z.string().max(60),
  weights: z.array(z.number()).max(4),
  why: z.string().max(240),
});

export const SymbolSpecSchema = z.object({
  /** A generative family (see symbols.ts). */
  family: z.string().max(20).optional(),
  /** Sanitised AI-drawn SVG in a 100×100 box, colours as palette roles. */
  svg: z.string().max(6000).optional(),
  /** Optional raster concept from an image model. */
  imageUrl: z.string().max(2000).optional(),
});

export const WORDMARK_CASES = ['lower', 'title', 'upper'] as const;

/** One complete visual direction ("look") a user can pick before the guidelines are built. */
export const LookSchema = z.object({
  id: z.string(),
  title: z.string(),
  concept: z.string(),
  style: z.enum(LOGO_STYLES),
  hue: z.number(),
  fontTrio: z.string(),
  markShape: z.enum(MARK_SHAPES),
  seed: z.number(),
  palette: z.array(PaletteSwatchSchema),
  symbol: SymbolSpecSchema.optional(),
  case: z.enum(WORDMARK_CASES).optional(),
  /** "ai" when a model designed the symbol, otherwise generated from the seed. */
  origin: z.enum(['ai', 'generative']).optional(),
});
export type Look = z.infer<typeof LookSchema>;

export const BrandKitSchema = z.object({
  name: z.string(),
  /** Kind of business (shared/sectors.ts), so the brand book shows the right objects. Older kits omit it. */
  sector: z.string().optional(),
  meaning: z.string(),
  story: z.string(),
  positioning: z.string(),
  mission: z.string(),
  vision: z.string(),
  audience: z.object({ primary: z.string(), secondary: z.string().optional(), insights: z.array(z.string()) }),
  personality: z.array(z.string()),
  archetype: z.object({ name: z.string(), description: z.string() }),
  voice: z.object({
    summary: z.string(),
    say: z.array(z.string()),
    not: z.array(z.string()),
    principles: z.array(z.string()),
  }),
  taglines: z.array(z.string()),
  messaging: z.object({
    oneLiner: z.string(),
    short: z.string(),
    long: z.string(),
    elevatorPitch: z.string(),
  }),
  identity: z.object({
    mark: z.object({ shape: z.enum(MARK_SHAPES), concept: z.string() }),
    wordmarkCase: z.enum(['lower', 'title']).default('lower'),
    /** The logo construction — very different families, chosen by the user. */
    style: z.enum(LOGO_STYLES).default('twinkle'),
    seed: z.number().default(0),
    symbol: SymbolSpecSchema.optional(),
    case: z.enum(WORDMARK_CASES).optional(),
    /** The options offered; the user picks one before the guidelines are final. */
    looks: z.array(LookSchema).default([]),
    lookChosen: z.boolean().default(true),
    logoDirections: z.array(z.object({ name: z.string(), description: z.string() })),
    palette: z.array(PaletteSwatchSchema),
    typography: z.object({ display: FontChoiceSchema, body: FontChoiceSchema, data: FontChoiceSchema }),
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
    /** Legacy: older kits carried a motion story. No longer generated or shown. */
    motion: z.object({ idle: z.string(), thinking: z.string(), mark: z.string(), done: z.string() }).optional(),
    /** The brand's core: one promise and three values with what they mean in practice. */
    essence: z.object({ promise: z.string(), values: z.array(z.object({ name: z.string(), meaning: z.string() })) }).optional(),
    /** Imagery direction: captions plus prompts an image model can render. */
    moodboard: z.array(z.object({ caption: z.string(), prompt: z.string(), imageUrl: z.string().optional() })).optional(),
    /** Raster concept sketches from an image model: inspiration for a designer, not the logo itself. */
    concepts: z.array(z.object({ caption: z.string(), prompt: z.string(), imageUrl: z.string() })).optional(),
    usageRules: z.object({ clearSpace: z.string(), minSize: z.string(), do: z.string(), dont: z.string() }),
  }),
  launch: z.object({
    bios: z.object({ instagram: z.string(), x: z.string(), linkedin: z.string(), youtube: z.string() }),
    posts: z.object({
      instagram: z.string(),
      linkedin: z.string(),
      xThread: z.array(z.string()),
      announcement: z.string(),
    }),
    contentIdeas: z.array(z.string()),
  }),
  website: z.object({
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
  }),
});
export type BrandKit = z.infer<typeof BrandKitSchema>;

export const CreateBrandRequestSchema = z.object({
  name: z.string().trim().min(1).max(40),
  brief: BriefSchema.partial({ description: true }).extend({ description: z.string().max(800).default('') }),
  projectId: z.string().uuid().optional(),
  domain: z.string().max(80).optional(),
  handle: z.string().max(40).optional(),
});

export const AssistantRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

export interface AssistantReply {
  reply: string;
  /** Partial brand kit to merge — only present when the assistant changed the brand. */
  patch?: Partial<BrandKit>;
  /** Extra names when the user asked for alternatives. */
  names?: string[];
  source: 'ai' | 'offline';
}

/* ------------------------------------------------------------------ */
/* API envelopes                                                       */
/* ------------------------------------------------------------------ */

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface SystemInfo {
  mode: 'live' | 'demo';
  ai: { provider: string; model?: string; live: boolean };
  domains: { provider: string; live: boolean; /** Registrar that confirms "available" answers, if configured. */ confirm?: string | null };
  social: { live: boolean; platforms: Record<string, string> };
  /** Image model for moodboards and concept sketches. */
  images?: { provider: string; live: boolean };
}
