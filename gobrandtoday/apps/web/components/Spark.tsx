import { IDLE_PATH, MARK_PATHS, THINKING_PATH, type MarkShape } from '@gbt/shared';

const SPARK = MARK_PATHS.spark.d;

/** The GoBrandToday spark (or any user mark) as an inline SVG. */
export function Mark({
  shape = 'spark',
  size = 20,
  color = '#6D4AFF',
  className,
  style,
  title,
}: {
  shape?: MarkShape;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const m = MARK_PATHS[shape] ?? MARK_PATHS.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} className={className} style={style}>
      {title && <title>{title}</title>}
      <path d={m.d} fill={color} fillRule={m.evenOdd ? 'evenodd' : undefined} />
    </svg>
  );
}

export function Spark(props: Omit<Parameters<typeof Mark>[0], 'shape'>) {
  return <Mark shape="spark" {...props} />;
}

/**
 * The AI moment: calm dot → soft diamond → spark → a tiny aqua twin for "done".
 * Exactly the motion story from the guidelines, looping while we work.
 */
export function SparkLoader({ size = 72, color = '#6D4AFF', twin = '#19C3B4', shape = 'spark', label }: { size?: number; color?: string; twin?: string; shape?: MarkShape; label?: string }) {
  const mark = MARK_PATHS[shape] ?? MARK_PATHS.spark;
  return (
    <div className="spark-loader" style={{ ['--size' as string]: `${size}px` }} role="img" aria-label={label ?? 'Working…'}>
      <svg className="s-dot" viewBox="0 0 64 64" aria-hidden="true">
        <path d={IDLE_PATH} fill={color} transform="translate(16 16) scale(0.5)" />
      </svg>
      <svg className="s-diamond" viewBox="0 0 64 64" aria-hidden="true">
        <path d={THINKING_PATH} fill={color} />
      </svg>
      <svg className="s-spark" viewBox="0 0 64 64" aria-hidden="true">
        <path d={mark.d} fill={color} fillRule={mark.evenOdd ? 'evenodd' : undefined} />
      </svg>
      <svg className="s-twin" viewBox="0 0 64 64" aria-hidden="true">
        <path d={SPARK} fill={twin} transform="translate(44 2) scale(0.28)" />
      </svg>
    </div>
  );
}

/** "gobrandtoday✦" — lowercase wordmark, the full stop is a spark. */
export function Wordmark({ size = 24, dark = false, className }: { size?: number; dark?: boolean; className?: string }) {
  return (
    <span className={`wordmark ${className ?? ''}`} style={{ fontSize: size, gap: Math.max(2, size / 12), color: dark ? '#FAFAF7' : undefined }}>
      gobrandtoday
      <Spark size={Math.round(size * 0.46)} color={dark ? '#19C3B4' : '#6D4AFF'} className="twinkle" />
    </span>
  );
}
