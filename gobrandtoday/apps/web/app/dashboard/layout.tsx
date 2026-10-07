import type { Metadata } from 'next';
import { DashNav } from '@/components/Dashboard';
import { Shell } from '@/components/ui';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell footer={false}>
      <div className="container dash">
        <DashNav />
        <div>{children}</div>
      </div>
    </Shell>
  );
}
