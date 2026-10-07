import { ImageResponse } from 'next/og';

export const alt = 'GoBrandToday — Your idea deserves a brand';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SPARK = 'M32 2 Q36 28 62 32 Q36 36 32 62 Q28 36 2 32 Q28 28 32 2Z';

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#FAFAF7', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, fontSize: 64, fontWeight: 700, letterSpacing: -3, color: '#16161A' }}>
          gobrandtoday
          <svg width="30" height="30" viewBox="0 0 64 64" style={{ marginBottom: 14 }}>
            <path d={SPARK} fill="#6D4AFF" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -4, color: '#16161A', lineHeight: 1 }}>Your idea deserves a brand.</div>
          <div style={{ fontSize: 32, color: '#36315A' }}>Name · domain · handles · score · identity — in minutes.</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['#16161A', '#6D4AFF', '#19C3B4', '#ECE7FF'].map((c) => (
            <div key={c} style={{ width: 120, height: 20, borderRadius: 10, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
