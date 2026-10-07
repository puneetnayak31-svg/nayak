import { env } from '../../config/env';
import { httpFetch } from '../../lib/http';
import { logger } from '../../lib/logger';

/**
 * Image generation for moodboards and logo concept sketches. Every backend
 * here has a free tier, and Pollinations needs no key at all, so imagery works
 * out of the box. Vector logos are never rasterised from these: the logo
 * system stays SVG, and images are inspiration and imagery direction.
 */
export interface ImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}

export type ImageResult = { kind: 'url'; url: string } | { kind: 'bytes'; contentType: string; data: Buffer };

export interface ImageProvider {
  readonly id: 'pollinations' | 'huggingface' | 'cloudflare' | 'together' | 'openai' | 'none';
  readonly live: boolean;
  generate(req: ImageRequest): Promise<ImageResult>;
}

const clean = (p: string) => p.replace(/\s+/g, ' ').trim().slice(0, 900);

/** Pollinations: free, keyless FLUX. Returns a stable URL the browser loads directly. */
export class PollinationsProvider implements ImageProvider {
  readonly id = 'pollinations' as const;
  readonly live = true;
  constructor(private readonly token?: string) {}
  async generate(req: ImageRequest): Promise<ImageResult> {
    const params = new URLSearchParams({
      width: String(req.width ?? 768),
      height: String(req.height ?? 768),
      model: 'flux',
      seed: String(req.seed ?? Math.floor(Math.random() * 1e6)),
      nologo: 'true',
      private: 'true',
    });
    if (this.token) params.set('token', this.token);
    return { kind: 'url', url: `https://image.pollinations.ai/prompt/${encodeURIComponent(clean(req.prompt))}?${params}` };
  }
}

/** Hugging Face Inference (free tier with a token): FLUX.1-schnell by default. */
export class HuggingFaceProvider implements ImageProvider {
  readonly id = 'huggingface' as const;
  readonly live = true;
  constructor(
    private readonly token: string,
    private readonly model: string,
  ) {}
  async generate(req: ImageRequest): Promise<ImageResult> {
    const res = await httpFetch(`https://router.huggingface.co/hf-inference/models/${this.model}`, {
      method: 'POST',
      timeoutMs: 60_000,
      retries: 1,
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json', accept: 'image/png' },
      body: JSON.stringify({ inputs: clean(req.prompt), parameters: { width: req.width ?? 768, height: req.height ?? 768, seed: req.seed } }),
    });
    if (!res.ok) throw new Error(`Hugging Face HTTP ${res.status}`);
    return { kind: 'bytes', contentType: res.headers.get('content-type') ?? 'image/png', data: Buffer.from(await res.arrayBuffer()) };
  }
}

/** Cloudflare Workers AI (free daily allowance): @cf/black-forest-labs/flux-1-schnell. */
export class CloudflareProvider implements ImageProvider {
  readonly id = 'cloudflare' as const;
  readonly live = true;
  constructor(
    private readonly accountId: string,
    private readonly token: string,
  ) {}
  async generate(req: ImageRequest): Promise<ImageResult> {
    const res = await httpFetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
      method: 'POST',
      timeoutMs: 60_000,
      retries: 1,
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: clean(req.prompt), steps: 6, seed: req.seed }),
    });
    if (!res.ok) throw new Error(`Cloudflare AI HTTP ${res.status}`);
    const body = (await res.json()) as { result?: { image?: string } };
    if (!body.result?.image) throw new Error('Cloudflare AI returned no image');
    return { kind: 'bytes', contentType: 'image/jpeg', data: Buffer.from(body.result.image, 'base64') };
  }
}

/** Together AI: FLUX.1-schnell-Free. */
export class TogetherProvider implements ImageProvider {
  readonly id = 'together' as const;
  readonly live = true;
  constructor(private readonly key: string) {}
  async generate(req: ImageRequest): Promise<ImageResult> {
    const res = await httpFetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      timeoutMs: 60_000,
      retries: 1,
      headers: { authorization: `Bearer ${this.key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'black-forest-labs/FLUX.1-schnell-Free', prompt: clean(req.prompt), width: req.width ?? 768, height: req.height ?? 768, steps: 4, n: 1, seed: req.seed, response_format: 'b64_json' }),
    });
    if (!res.ok) throw new Error(`Together HTTP ${res.status}`);
    const body = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const d = body.data?.[0];
    if (d?.b64_json) return { kind: 'bytes', contentType: 'image/png', data: Buffer.from(d.b64_json, 'base64') };
    if (d?.url) return { kind: 'url', url: d.url };
    throw new Error('Together returned no image');
  }
}

/** OpenAI Images (paid). */
export class OpenAIImageProvider implements ImageProvider {
  readonly id = 'openai' as const;
  readonly live = true;
  constructor(private readonly key: string) {}
  async generate(req: ImageRequest): Promise<ImageResult> {
    const res = await httpFetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      timeoutMs: 90_000,
      retries: 0,
      headers: { authorization: `Bearer ${this.key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.OPENAI_IMAGE_MODEL, prompt: clean(req.prompt), size: '1024x1024', n: 1 }),
    });
    if (!res.ok) throw new Error(`OpenAI Images HTTP ${res.status}`);
    const body = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const d = body.data?.[0];
    if (d?.b64_json) return { kind: 'bytes', contentType: 'image/png', data: Buffer.from(d.b64_json, 'base64') };
    if (d?.url) return { kind: 'url', url: d.url };
    throw new Error('OpenAI returned no image');
  }
}

export class NoImageProvider implements ImageProvider {
  readonly id = 'none' as const;
  readonly live = false;
  async generate(): Promise<ImageResult> {
    throw new Error('Image generation is turned off (IMAGE_PROVIDER=none).');
  }
}

export function createImageProvider(): ImageProvider {
  const want = env.IMAGE_PROVIDER;
  const keyed: Array<[ImageProvider['id'], () => ImageProvider | undefined]> = [
    ['huggingface', () => (env.HF_TOKEN ? new HuggingFaceProvider(env.HF_TOKEN, env.HF_IMAGE_MODEL) : undefined)],
    ['cloudflare', () => (env.CF_ACCOUNT_ID && env.CF_API_TOKEN ? new CloudflareProvider(env.CF_ACCOUNT_ID, env.CF_API_TOKEN) : undefined)],
    ['together', () => (env.TOGETHER_API_KEY ? new TogetherProvider(env.TOGETHER_API_KEY) : undefined)],
    ['openai', () => (env.OPENAI_API_KEY ? new OpenAIImageProvider(env.OPENAI_API_KEY) : undefined)],
  ];
  if (want === 'none') return new NoImageProvider();
  if (want === 'pollinations') return new PollinationsProvider(env.POLLINATIONS_TOKEN);
  if (want === 'auto') {
    for (const [id, make] of keyed) {
      if (id === 'openai') continue; // paid: only when asked for explicitly
      const p = make();
      if (p) return p;
    }
    return new PollinationsProvider(env.POLLINATIONS_TOKEN);
  }
  const p = keyed.find(([id]) => id === want)?.[1]();
  if (p) return p;
  logger.warn(`IMAGE_PROVIDER=${want} is missing credentials — using Pollinations (free, keyless)`);
  return new PollinationsProvider(env.POLLINATIONS_TOKEN);
}

export const images = createImageProvider();
