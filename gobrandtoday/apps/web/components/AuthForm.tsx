'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError, api } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { Spark, Wordmark } from './Spark';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const q = useSearchParams();
  const { refreshMe, system, me } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(q.get('error') === 'google_not_configured' ? 'Google sign-in isn’t set up on this server yet.' : q.get('error') ? 'Google sign-in failed. Please try again.' : null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/api/auth/${mode}`, { body: mode === 'signup' ? { email, password, name: name || undefined } : { email, password } });
      await refreshMe();
      router.push(q.get('next') ?? '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480, padding: '56px var(--gutter) 80px' }}>
      <form className="card stack gap-16" onSubmit={submit} style={{ boxShadow: 'var(--shadow-lg)' }}>
        <Wordmark size={24} />
        <div className="stack gap-6">
          <h1 className="display" style={{ fontSize: 32 }}>
            {mode === 'signup' ? 'Save your brands.' : 'Welcome back.'}
          </h1>
          <p className="soft">
            {mode === 'signup'
              ? me?.isGuest
                ? 'Everything you’ve made so far comes with you.'
                : 'Free forever. No card needed.'
              : 'Sign in to see your brands. Anything you made as a guest will be merged in.'}
          </p>
          {q.get('plan') && <span className="badge">Interested in {q.get('plan')} — it’s free during early access</span>}
        </div>
        {system?.features?.googleLogin && (
          <>
            <a href="/api/auth/google" className="btn btn-outline btn-block">
              Continue with Google
            </a>
            <div className="row gap-12 muted tiny">
              <hr className="divider grow" /> or <hr className="divider grow" />
            </div>
          </>
        )}
        {mode === 'signup' && (
          <label className="stack gap-6">
            <span className="small" style={{ fontWeight: 700 }}>
              Name
            </span>
            <input className="input sm" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="stack gap-6">
          <span className="small" style={{ fontWeight: 700 }}>
            Email
          </span>
          <input className="input sm" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="stack gap-6">
          <span className="small" style={{ fontWeight: 700 }}>
            Password
          </span>
          <input
            className="input sm"
            type="password"
            required
            minLength={mode === 'signup' ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && <span className="field-hint">At least 8 characters.</span>}
        </label>
        {error && <div className="notice error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          <Spark size={14} color="#fff" /> {busy ? 'One moment…' : mode === 'signup' ? 'Create free account' : 'Sign in'}
        </button>
        <p className="small center muted">
          {mode === 'signup' ? (
            <>
              Already have an account? <Link href="/login">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link href="/signup">Create a free account</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
