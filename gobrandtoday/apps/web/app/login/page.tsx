import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { Shell } from '@/components/ui';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function Page() {
  return (
    <Shell footer={false}>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </Shell>
  );
}
