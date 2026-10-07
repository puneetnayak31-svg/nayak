import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolContent } from '@/components/ToolContent';
import { SEO_PAGES } from '@/lib/seo-pages';

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = SEO_PAGES.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/tools/${p.slug}` },
    openGraph: { title: p.title, description: p.description, url: `/tools/${p.slug}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = SEO_PAGES.find((x) => x.slug === slug);
  if (!p) notFound();
  return <ToolContent p={p} />;
}
