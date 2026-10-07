'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  googleFontsHref,
  iconSVG,
  logoSVG,
  lookToIdentity,
  type BrandKit,
  type Look,
  type LogoIdentity,
  type LogoVariant,
  type Measurer,
} from '@gbt/shared';

/* ------------------------------ font measuring ------------------------------ */

let ctx: CanvasRenderingContext2D | null = null;
const fontStr = (f: { family: string; weight: number; size: number }) => `${f.weight} ${f.size}px "${f.family}"`;

/** Canvas-based metrics using the real web font. */
export const canvasMeasure: Measurer = {
  width(text, f) {
    ctx ??= document.createElement('canvas').getContext('2d');
    if (!ctx) return text.length * f.size * 0.56;
    ctx.font = fontStr(f);
    return ctx.measureText(text).width;
  },
  xHeight(f) {
    ctx ??= document.createElement('canvas').getContext('2d');
    if (!ctx) return f.size * 0.52;
    ctx.font = fontStr(f);
    return ctx.measureText('x').actualBoundingBoxAscent || f.size * 0.52;
  },
  capHeight(f) {
    ctx ??= document.createElement('canvas').getContext('2d');
    if (!ctx) return f.size * 0.72;
    ctx.font = fontStr(f);
    return ctx.measureText('H').actualBoundingBoxAscent || f.size * 0.72;
  },
};

const loaded = new Set<string>();

/** Load the Google Fonts an identity needs, then report ready (re-measure once real metrics exist). */
export function useLogoFonts(fonts: Array<{ family: string; weights: number[] }>): number {
  const key = fonts.map((f) => `${f.family}:${f.weights.join(',')}`).join('|');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!fonts.length) return;
    const href = googleFontsHref(fonts);
    if (!document.querySelector(`link[data-gf="${CSS.escape(href)}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.gf = href;
      document.head.appendChild(link);
    }
    const todo = fonts.filter((f) => !loaded.has(`${f.family}:${Math.max(...f.weights)}`));
    if (!todo.length) return;
    let alive = true;
    Promise.all(todo.map((f) => document.fonts.load(`${Math.max(...f.weights)} 100px "${f.family}"`).catch(() => []))).then(() => {
      todo.forEach((f) => loaded.add(`${f.family}:${Math.max(...f.weights)}`));
      if (alive) setVersion((v) => v + 1);
    });
    // Font CSS may arrive after the first load() call — retry once it has.
    const t = setTimeout(() => alive && setVersion((v) => v + 1), 1200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return version;
}

export function kitIdentity(kit: BrandKit): LogoIdentity {
  return {
    name: kit.name,
    style: kit.identity.style ?? 'twinkle',
    palette: kit.identity.palette,
    typography: { display: kit.identity.typography.display, data: kit.identity.typography.data },
    mark: kit.identity.mark.shape,
    seed: kit.identity.seed ?? 0,
  };
}

function Svg({ svg, height, width, className, label }: { svg: string; height?: number; width?: number | string; className?: string; label: string }) {
  const aria = `aria-label="${label.replace(/"/g, '')}"`;
  if (width !== undefined) {
    // Width-driven: the wrapper takes the width, the SVG fills it and keeps its aspect ratio.
    const sized = svg.replace('<svg ', `<svg style="display:block;width:100%;height:auto" ${aria} `);
    return <span className={className} style={{ display: 'block', width: typeof width === 'number' ? `${width}px` : width, maxWidth: '100%', lineHeight: 0, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: sized }} />;
  }
  const sized = svg.replace('<svg ', `<svg style="display:block;height:${height ?? 48}px;width:auto;max-width:100%" ${aria} `);
  return <span className={className} style={{ display: 'inline-block', lineHeight: 0, maxWidth: '100%' }} dangerouslySetInnerHTML={{ __html: sized }} />;
}

/** The primary lockup for an identity. Size it with `height` (px) or `width`. */
export function Logo({ id, variant = 'light', height, width, className }: { id: LogoIdentity; variant?: LogoVariant; height?: number; width?: number | string; className?: string }) {
  const v = useLogoFonts([id.typography.display, id.typography.data]);
  const out = useMemo(() => logoSVG(id, { variant, measure: typeof document === 'undefined' ? undefined : canvasMeasure }), [id, variant, v]);
  return <Svg svg={out.svg} height={height} width={width} className={`gbt-logo ${className ?? ''}`} label={id.name} />;
}

export function LogoIcon({ id, size = 64 }: { id: LogoIdentity; size?: number }) {
  const v = useLogoFonts([id.typography.display]);
  const out = useMemo(() => iconSVG(id, { measure: typeof document === 'undefined' ? undefined : canvasMeasure }), [id, v]);
  return <Svg svg={out.svg} height={size} label={`${id.name} icon`} />;
}

export function KitLogo({ kit, ...rest }: { kit: BrandKit; variant?: LogoVariant; height?: number; width?: number | string; className?: string }) {
  const id = useMemo(() => kitIdentity(kit), [kit]);
  return <Logo id={id} {...rest} />;
}

export function KitIcon({ kit, size }: { kit: BrandKit; size?: number }) {
  const id = useMemo(() => kitIdentity(kit), [kit]);
  return <LogoIcon id={id} size={size} />;
}

export function lookIdentity(name: string, look: Look): LogoIdentity {
  return lookToIdentity(name, look);
}
