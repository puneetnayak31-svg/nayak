import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { Shell } from '@/components/ui';

export const metadata: Metadata = { title: 'Create account', robots: { index: false } };

export default function Page() {
  return (
    <Shell footer={false}>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </Shell>
  );
}
