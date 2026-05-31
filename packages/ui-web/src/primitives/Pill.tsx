import type { ReactNode } from 'react';
import './Pill.css';

export type PillTone = 'neutral' | 'urgent' | 'upcoming' | 'calendar' | 'remember' | 'gold';

type PillProps = {
  children: ReactNode;
  tone?: PillTone;
  outline?: boolean;
  leadingIcon?: ReactNode;
  className?: string;
};

/** Small status/label chip. Tone maps to a semantic accent token. */
export function Pill({
  children,
  tone = 'neutral',
  outline = false,
  leadingIcon,
  className,
}: PillProps) {
  return (
    <span
      className={`ds-pill ds-pill--${tone}${outline ? ' ds-pill--outline' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      {leadingIcon !== undefined && <span className="ds-pill__lead">{leadingIcon}</span>}
      {children}
    </span>
  );
}
