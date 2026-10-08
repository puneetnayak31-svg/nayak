/**
 * Simplified platform icons (24×24), drawn in white on each platform's own
 * colour. Used to say "we check this platform"; they are not endorsements.
 */
const W = '#fff';

export const PLATFORM_ICON: Record<string, { bg: string; body: string }> = {
  instagram: {
    bg: 'linear-gradient(135deg,#F58529,#DD2A7B 55%,#8134AF)',
    body: `<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="${W}" stroke-width="2"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="${W}" stroke-width="2"/><circle cx="16.9" cy="7.1" r="1.2" fill="${W}"/>`,
  },
  x: {
    bg: '#16161A',
    body: `<path d="M4.5 4h4.3l10.7 16h-4.3z" fill="${W}"/><path d="M18.8 4 13.3 10.3M10.7 13.7 5.2 20" stroke="${W}" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  youtube: {
    bg: '#FF0033',
    body: `<rect x="3" y="6" width="18" height="12" rx="3.5" fill="none" stroke="${W}" stroke-width="1.8"/><path d="M10 9.2v5.6l4.9-2.8z" fill="${W}"/>`,
  },
  linkedin: {
    bg: '#0A66C2',
    body: `<circle cx="6.4" cy="6.4" r="1.8" fill="${W}"/><rect x="4.8" y="9.4" width="3.2" height="10" rx=".6" fill="${W}"/><path d="M10.4 9.4h3v1.5c.6-1 1.8-1.8 3.3-1.8 2.5 0 3.6 1.6 3.6 4.3v6h-3.2v-5.5c0-1.4-.5-2.1-1.6-2.1-1.2 0-1.9.8-1.9 2.2v5.4h-3.2z" fill="${W}"/>`,
  },
  tiktok: {
    bg: '#111111',
    body: `<path d="M14.2 3.5h3c.2 1.9 1.4 3.2 3.3 3.4v3.1c-1.3 0-2.4-.4-3.3-1v6.1a5.2 5.2 0 1 1-5.2-5.2l.9.1v3.1a2.2 2.2 0 1 0 1.3 2z" fill="#25F4EE" transform="translate(-.7 .5)"/><path d="M14.2 3.5h3c.2 1.9 1.4 3.2 3.3 3.4v3.1c-1.3 0-2.4-.4-3.3-1v6.1a5.2 5.2 0 1 1-5.2-5.2l.9.1v3.1a2.2 2.2 0 1 0 1.3 2z" fill="${W}"/>`,
  },
  facebook: {
    bg: '#1877F2',
    body: `<path d="M13.4 20.5v-7h2.4l.4-2.9h-2.8V8.8c0-.8.3-1.4 1.5-1.4h1.5V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.5v7z" fill="${W}"/>`,
  },
  threads: {
    bg: '#000000',
    body: `<path d="M16.4 11.1c-.4-2.3-2-3.6-4.3-3.6-2.7 0-4.5 2-4.5 4.7 0 2.8 1.8 4.7 4.4 4.7 2.3 0 3.8-1.4 3.8-3.3 0-3.5-5.8-3.6-5.8-.7 0 1.1.9 1.8 2.1 1.8 2.6 0 3.4-2.4 3.4-4.8M12 20.5c-4.8 0-8-3.4-8-8.4S7.2 3.5 12 3.5c4.1 0 6.9 2.3 7.8 6" fill="none" stroke="${W}" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  pinterest: {
    bg: '#E60023',
    body: `<path d="M12.3 3.5c-4.7 0-7.1 3.3-7.1 6.1 0 1.7.6 3.2 2 3.7.2.1.4 0 .5-.2l.2-.8c.1-.3 0-.4-.2-.6-.4-.5-.7-1.1-.7-2 0-2.6 1.9-4.9 5-4.9 2.7 0 4.2 1.7 4.2 3.9 0 2.9-1.3 5.4-3.2 5.4-1 0-1.8-.9-1.6-1.9.3-1.3.9-2.6.9-3.5 0-.8-.4-1.5-1.3-1.5-1.1 0-1.9 1.1-1.9 2.6 0 .9.3 1.6.3 1.6l-1.3 5.4c-.4 1.6 0 3.5 0 3.7l.3.1c.1-.1 1.3-1.6 1.7-3.1l.7-2.6c.3.6 1.3 1.2 2.4 1.2 3.1 0 5.2-2.8 5.2-6.6 0-2.9-2.4-5.6-6.1-5.6z" fill="${W}"/>`,
  },
  reddit: {
    bg: '#FF4500',
    body: `<ellipse cx="12" cy="14.2" rx="7" ry="4.8" fill="${W}"/><circle cx="9.4" cy="13.6" r="1.1" fill="#FF4500"/><circle cx="14.6" cy="13.6" r="1.1" fill="#FF4500"/><path d="M9.6 16.4c1.4.9 3.4.9 4.8 0" stroke="#FF4500" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M12 9.4l1.1-4.2 3.2.8" stroke="${W}" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="17.4" cy="6.2" r="1.4" fill="${W}"/><circle cx="5.6" cy="11.4" r="1.6" fill="${W}"/><circle cx="18.4" cy="11.4" r="1.6" fill="${W}"/>`,
  },
  github: {
    bg: '#24292F',
    body: `<path d="M12 3a9 9 0 0 0-2.8 17.5c.4.1.6-.2.6-.4v-1.6c-2.5.5-3-1.1-3-1.1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.4 0-1 .4-1.8.9-2.4-.1-.2-.4-1.1.1-2.3 0 0 .8-.2 2.5.9a8.6 8.6 0 0 1 4.6 0c1.7-1.1 2.5-.9 2.5-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.8.6 1.6v2.4c0 .2.2.5.6.4A9 9 0 0 0 12 3z" fill="${W}"/>`,
  },
};

export function PlatformIcon({ id, size = 28, title }: { id: string; size?: number; title?: string }) {
  const p = PLATFORM_ICON[id];
  if (!p) return null;
  return (
    <span className="pf-icon" style={{ width: size, height: size, background: p.bg }} title={title} aria-hidden={title ? undefined : true}>
      <svg viewBox="0 0 24 24" width={Math.round(size * 0.66)} height={Math.round(size * 0.66)} dangerouslySetInnerHTML={{ __html: p.body }} />
    </span>
  );
}
