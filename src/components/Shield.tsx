import type { CSSProperties } from 'preact';
import { SHIELD_OUTLINE, SHIELD_REGIONS, SHIELD_VIEWBOX, type Band } from '@/lib/shield';

interface Props {
  /** Top, middle and bottom colour. */
  colors: readonly [string, string, string];
  band: Band;
  /** Accessible name; omit when the fraternity is already named next to the shield. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/** A fraternity's colour shield, drawn as vector so it stays sharp at any size. */
export function Shield({ colors, band, title, className, style }: Props) {
  const [top, middle, bottom] = colors;
  const { top: topPath, bottom: bottomPath } = SHIELD_REGIONS[band];
  return (
    <svg
      viewBox={SHIELD_VIEWBOX}
      class={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={SHIELD_OUTLINE} fill={middle} />
      <path d={topPath} fill={top} />
      <path d={bottomPath} fill={bottom} />
      <path d={SHIELD_OUTLINE} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
    </svg>
  );
}
