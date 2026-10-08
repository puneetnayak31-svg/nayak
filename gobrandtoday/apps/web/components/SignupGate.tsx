'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState, type ReactNode } from 'react';
import { useApp } from '@/lib/providers';
import { Spark } from './Spark';

/**
 * Downloads need a free account. The Brand Box itself is free to build and
 * view as a guest; taking files away asks for a sign-up first, so the work is
 * saved to an account before it leaves the app.
 *
 * `guard(fn)` runs `fn` for accounts and opens the sign-up prompt for guests.
 */
export function useSignupGate(): { isGuest: boolean; guard: <A extends unknown[]>(fn: (...a: A) => unknown) => (...a: A) => void; gate: ReactNode } {
  const { me } = useApp();
  const isGuest = !me || me.isGuest;
  const [open, setOpen] = useState(false);
  const guard = useCallback(
    <A extends unknown[]>(fn: (...a: A) => unknown) =>
      (...a: A) => {
        if (isGuest) setOpen(true);
        else void fn(...a);
      },
    [isGuest],
  );
  return { isGuest, guard, gate: open ? <SignupPrompt onClose={() => setOpen(false)} /> : null };
}

export function SignupPrompt({ onClose }: { onClose: () => void }) {
  const path = usePathname();
  const next = encodeURIComponent(path || '/dashboard');
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="sg-h" onClick={onClose}>
      <div className="modal stack gap-16 sg-modal" onClick={(e) => e.stopPropagation()}>
        <span className="sg-icon" aria-hidden="true">
          <Spark size={22} color="#fff" />
        </span>
        <div className="stack gap-8">
          <h2 id="sg-h" className="h3" style={{ fontSize: 22 }}>
            Create a free account to download
          </h2>
          <p className="soft">Your Brand Box is free and already saved in this browser. A free account (30 seconds, no card) keeps it safe and unlocks every download: logos, the brand book, mockups, the website draft and the full ZIP.</p>
        </div>
        <div className="row gap-8 wrap">
          <Link href={`/signup?next=${next}`} className="btn btn-primary">
            Create free account
          </Link>
          <Link href={`/login?next=${next}`} className="btn btn-ghost">
            I have an account
          </Link>
        </div>
        <button type="button" className="btn-link small" style={{ alignSelf: 'flex-start' }} onClick={onClose}>
          Not now
        </button>
      </div>
    </div>
  );
}
