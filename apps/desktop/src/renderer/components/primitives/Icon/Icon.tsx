import type { CSSProperties } from 'react';
import {
  IconArrow,
  IconBack,
  IconCal,
  IconCheck,
  IconChevron,
  IconCommand,
  IconMic,
  IconPaperclip,
  IconPlus,
  IconSpark,
  IconThumbsDown,
  IconThumbsUp,
} from '../../Icons';
import './Icon.css';

export type IconName =
  | 'arrow'
  | 'back'
  | 'calendar'
  | 'check'
  | 'chevron'
  | 'command'
  | 'mic'
  | 'paperclip'
  | 'plus'
  | 'spark'
  | 'thumbs-up'
  | 'thumbs-down';

export type IconTone = 'default' | 'muted' | 'inherit' | 'urgent' | 'upcoming' | 'calendar';

type GlyphProps = { size?: number };
type Glyph = (props: GlyphProps) => JSX.Element;

const GLYPHS: Record<IconName, Glyph> = {
  arrow: IconArrow,
  back: IconBack,
  calendar: IconCal,
  check: IconCheck,
  chevron: IconChevron,
  command: IconCommand,
  mic: IconMic,
  paperclip: IconPaperclip,
  plus: IconPlus,
  spark: IconSpark,
  'thumbs-up': IconThumbsUp,
  'thumbs-down': IconThumbsDown,
};

type IconProps = {
  name: IconName;
  size?: number;
  tone?: IconTone;
  rotate?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/** Canonical icon wrapper. Sets tone via semantic token; never accepts raw hex. */
export function Icon({
  name,
  size = 14,
  tone = 'default',
  rotate,
  label,
  className,
  style,
}: IconProps) {
  const Glyph = GLYPHS[name];
  const a11y = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true } as const);
  const wrapperStyle: CSSProperties = {
    width: size,
    height: size,
    ...(rotate !== undefined ? { transform: `rotate(${rotate}deg)` } : {}),
    ...style,
  };
  return (
    <span
      className={`ds-icon ds-icon--${tone}${className ? ` ${className}` : ''}`}
      style={wrapperStyle}
      {...a11y}
    >
      <Glyph size={size} />
    </span>
  );
}
