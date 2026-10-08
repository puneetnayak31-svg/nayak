import type { Metadata } from 'next';
import { ToolsIndex } from '@/components/ToolsIndex';

export const metadata: Metadata = {
  title: 'Free branding tools: name generator, domain checker, username checker, banner makers',
  description: 'Free tools for founders in India and beyond: AI brand name generator, domain availability checker with prices, social media username checker, brand bible generator, and logo-to-social-kit tools (LinkedIn, X and YouTube banners, profile picture, brand guidelines).',
  alternates: { canonical: '/tools' },
};

export default function Page() {
  return <ToolsIndex />;
}
