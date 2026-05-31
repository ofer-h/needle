import type { CSSProperties } from 'react';

/** Self-contained icon set (inline SVG, currentColor stroke) so @needle/ui-web
 * carries no icon-font dependency. Tone maps to a semantic token; never a raw
 * hex. Add new glyphs to PATHS below. */

export type IconName =
  | 'check'
  | 'chevron'
  | 'plus'
  | 'spark'
  | 'calendar'
  | 'clock'
  | 'arrow'
  | 'bell'
  | 'x'
  | 'mic'
  | 'undo'
  | 'pin'
  | 'play'
  | 'pause'
  | 'dots'
  | 'grip'
  | 'sun'
  | 'moon'
  | 'coach'
  | 'chat'
  | 'layout';

export type IconTone = 'default' | 'muted' | 'inherit' | 'urgent' | 'upcoming' | 'calendar';

const TONE_COLOR: Record<IconTone, string> = {
  default: 'var(--icon-default)',
  muted: 'var(--icon-muted)',
  inherit: 'currentColor',
  urgent: 'var(--urgent)',
  upcoming: 'var(--upcoming)',
  calendar: 'var(--calendar)',
};

/** Each glyph is an SVG fragment drawn on a 24×24 viewBox with stroke. */
const PATHS: Record<IconName, JSX.Element> = {
  check: <polyline points="20 6 9 17 4 12" />,
  chevron: <polyline points="9 18 15 12 9 6" />,
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  spark: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </>
  ),
  arrow: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </>
  ),
  undo: (
    <>
      <polyline points="9 14 4 9 9 4" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
    </>
  ),
  pin: (
    <>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M9 2h6l-1 7 3 3H7l3-3-1-7z" />
    </>
  ),
  play: <polygon points="7 4 19 12 7 20 7 4" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.2" />
      <circle cx="15" cy="6" r="1.2" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <circle cx="9" cy="18" r="1.2" />
      <circle cx="15" cy="18" r="1.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  coach: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />,
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  size?: number;
  tone?: IconTone;
  rotate?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
};

const FILLED: Partial<Record<IconName, boolean>> = { spark: true, play: true, pause: true };

export function Icon({
  name,
  size = 14,
  tone = 'default',
  rotate,
  label,
  className,
  style,
  strokeWidth = 1.8,
}: IconProps) {
  const filled = FILLED[name] ?? false;
  const a11y = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true } as const);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? TONE_COLOR[tone] : 'none'}
      stroke={filled ? 'none' : TONE_COLOR[tone]}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        flexShrink: 0,
        ...(rotate !== undefined ? { transform: `rotate(${rotate}deg)` } : {}),
        ...style,
      }}
      {...a11y}
    >
      {PATHS[name]}
    </svg>
  );
}
