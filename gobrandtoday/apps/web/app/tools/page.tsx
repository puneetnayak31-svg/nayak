import type { Metadata } from 'next';
import { ToolsIndex } from '@/components/ToolsIndex';

export const metadata: Metadata = {
  title: 'Free branding tools: name generator, domain checker, username checker, brand bible',
  description: 'Free tools for founders in India and beyond: AI brand name generator, domain availability checker with prices, social media username checker and brand bible generator.',
  alternates: { canonical: '/tools' },
};

export default function Page() {
  return <ToolsIndex />;
}
