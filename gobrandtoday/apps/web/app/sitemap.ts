import type { MetadataRoute } from 'next';
import { SEO_PAGES } from '@/lib/seo-pages';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gobrandtoday.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/create`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/experts`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...SEO_PAGES.map((p) => ({ url: `${SITE}/tools/${p.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
