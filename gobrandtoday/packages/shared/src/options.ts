/**
 * Option catalogues shared by the web app and the API.
 * Keeping them here means a new chip / mode / platform is a one-line change.
 */

export const INDUSTRIES = [
  'AI',
  'SaaS',
  'Fintech',
  'Fashion',
  'Media',
  'Food',
  'Healthcare',
  'Education',
  'Creator',
  'Consumer',
  'E-commerce',
  'Consulting',
  'Other',
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const GEOGRAPHIES = ['Global', 'India', 'US', 'UK', 'Europe', 'Asia'] as const;

export const PERSONALITIES = [
  'Premium',
  'Bold',
  'Minimal',
  'Playful',
  'Futuristic',
  'Trustworthy',
  'Luxury',
  'Human',
  'Youthful',
  'Technical',
  'Creative',
  'Traditional',
  'Experimental',
] as const;
export type Personality = (typeof PERSONALITIES)[number];

export const NAME_STYLES = [
  'Short',
  'One word',
  'Two words',
  'Invented',
  'Real word',
  'Abstract',
  'Descriptive',
  'Premium',
  'Tech',
  'Playful',
  'Indian-inspired',
  'Global',
  'Founder-led',
] as const;
export type NameStyle = (typeof NAME_STYLES)[number];

export const TLDS = ['com', 'in', 'ai', 'io', 'co', 'app', 'xyz', 'co.in', 'store', 'studio'] as const;
export const DEFAULT_TLDS = ['com', 'in', 'ai', 'io', 'co'];

export const NAME_MODES = [
  { id: 'smart', label: 'Smart', hint: 'We pick the best strategy for your idea.' },
  { id: 'short', label: 'Short & Punchy', hint: 'Four to six letters. Easy to say, easy to type.' },
  { id: 'premium', label: 'Premium', hint: 'Quiet, confident, luxury-leaning.' },
  { id: 'tech', label: 'Tech / AI', hint: 'Technology-forward names.' },
  { id: 'invented', label: 'Invented', hint: 'New words nobody owns yet.' },
  { id: 'human', label: 'Human', hint: 'Warm and approachable.' },
  { id: 'global', label: 'Global', hint: 'Easy to say in any language.' },
  { id: 'india', label: 'India-Inspired', hint: 'Rooted in Indian languages, ready for the world.' },
  { id: 'seo', label: 'SEO-Friendly', hint: 'Meaningful words people already search for.' },
  { id: 'domain_first', label: 'Domain-First', hint: 'Only names whose domain is free right now.' },
] as const;
export type NameMode = (typeof NAME_MODES)[number]['id'];

export const REFINEMENTS = [
  'Shorter',
  'More premium',
  'More Indian',
  'More global',
  'Less techy',
  'More futuristic',
  'Easier to pronounce',
  'More playful',
  'More serious',
  'More neutral',
  'More feminine',
  'More masculine',
] as const;

export const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', profileUrl: 'https://www.instagram.com/{handle}/' },
  { id: 'x', label: 'X', profileUrl: 'https://x.com/{handle}' },
  { id: 'youtube', label: 'YouTube', profileUrl: 'https://www.youtube.com/@{handle}' },
  { id: 'linkedin', label: 'LinkedIn', profileUrl: 'https://www.linkedin.com/company/{handle}/' },
  { id: 'tiktok', label: 'TikTok', profileUrl: 'https://www.tiktok.com/@{handle}' },
  { id: 'facebook', label: 'Facebook', profileUrl: 'https://www.facebook.com/{handle}' },
  { id: 'threads', label: 'Threads', profileUrl: 'https://www.threads.net/@{handle}' },
  { id: 'pinterest', label: 'Pinterest', profileUrl: 'https://www.pinterest.com/{handle}/' },
  { id: 'reddit', label: 'Reddit', profileUrl: 'https://www.reddit.com/user/{handle}/' },
  { id: 'github', label: 'GitHub', profileUrl: 'https://github.com/{handle}' },
] as const;
export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]['id'];
export const SOCIAL_PLATFORM_IDS = SOCIAL_PLATFORMS.map((p) => p.id) as SocialPlatformId[];

export function profileUrl(platform: SocialPlatformId, handle: string): string {
  const p = SOCIAL_PLATFORMS.find((x) => x.id === platform);
  return p ? p.profileUrl.replace('{handle}', encodeURIComponent(handle)) : '';
}
