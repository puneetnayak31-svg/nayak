'use client';

import { MARK_PATHS, onColor, swatch, wordmarkText, type BrandKit } from '@gbt/shared';
import { Mark } from './Spark';

export type Variant = 'light' | 'dark' | 'tint';

/** Colours per the system's usage rule: brand mark on light; accent (or soft brand) mark on ink. */
export function variantColors(kit: BrandKit, variant: Variant) {
  const p = kit.identity.palette;
  if (variant === 'dark') return { bg: swatch(p, 'ink'), text: swatch(p, 'paper'), mark: swatch(p, 'accent') };
  if (variant === 'tint') return { bg: swatch(p, 'tint'), text: swatch(p, 'ink'), mark: swatch(p, 'brand') };
  return { bg: '#FFFFFF', text: swatch(p, 'ink'), mark: swatch(p, 'brand') };
}

export function BrandWordmark({ kit, size = 64, variant = 'light', markColor }: { kit: BrandKit; size?: number; variant?: Variant; markColor?: string }) {
  const c = variantColors(kit, variant);
  const display = kit.identity.typography.display;
  const weight = Math.max(...display.weights);
  return (
    <span
      style={{
        fontFamily: `'${display.family}', var(--font-display)`,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.05em',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: Math.max(2, size / 12),
        color: c.text,
        whiteSpace: 'nowrap',
      }}
      aria-label={kit.name}
    >
      {wordmarkText(kit.name, kit.identity.wordmarkCase)}
      <Mark shape={kit.identity.mark.shape} size={Math.round(size * 0.46)} color={markColor ?? c.mark} />
    </span>
  );
}

/** App-icon tile: the first letter on ink with the mark at its baseline ("g✦" in the guidelines). */
export function LetterTile({ kit, size = 104 }: { kit: BrandKit; size?: number }) {
  const p = kit.identity.palette;
  const display = kit.identity.typography.display;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: swatch(p, 'ink'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flex: 'none',
      }}
      aria-hidden="true"
    >
      <span style={{ fontFamily: `'${display.family}', var(--font-display)`, fontWeight: Math.max(...display.weights), fontSize: size * 0.62, lineHeight: 1, color: swatch(p, 'paper'), marginTop: -size * 0.1 }}>
        {kit.name.trim()[0]!.toLowerCase()}
      </span>
      <Mark shape={kit.identity.mark.shape} size={size * 0.21} color={swatch(p, 'accent')} style={{ marginTop: size * 0.2 }} />
    </div>
  );
}

export function MarkTile({ kit, size = 56 }: { kit: BrandKit; size?: number }) {
  const brand = swatch(kit.identity.palette, 'brand');
  return (
    <div style={{ width: size, height: size, borderRadius: size / 4, background: brand, display: 'grid', placeItems: 'center', flex: 'none' }} aria-hidden="true">
      <Mark shape={kit.identity.mark.shape} size={size * 0.57} color={onColor(brand)} />
    </div>
  );
}

export function markLabel(kit: BrandKit) {
  return MARK_PATHS[kit.identity.mark.shape]?.label ?? 'Mark';
}
