'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AccountMenu } from './AccountMenu';
import { Spark, Wordmark } from './Spark';

const LINKS = [
  { href: '/create', label: 'Create' },
  { href: '/tools', label: 'Free tools' },
  { href: '/experts', label: 'Experts' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/dashboard', label: 'My brands' },
];

export function Nav() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <div className="container nav-inner">
        <Link href="/" aria-label="GoBrandToday home" className="wordmark">
          <Wordmark size={24} />
        </Link>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="row gap-10">
          <AccountMenu />
          <Link href="/create" className="btn btn-primary btn-sm nav-cta">
            <Spark size={14} color="#fff" />
            Create my brand
          </Link>
          <Link href="/create" className="btn btn-primary btn-icon show-sm" aria-label="Create my brand">
            <Spark size={16} color="#fff" />
          </Link>
        </div>
      </div>
    </header>
  );
}
