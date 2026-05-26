import type { ReactNode } from 'react';
import './Pill.css';

export type PillVariant = 'neutral' | 'urgent' | 'upcoming' | 'outline';
export type PillSize = 'sm' | 'md';

type PillProps = {
  children: ReactNode;
  variant?: PillVariant;
  size?: PillSize;
  leading?: ReactNode;
  /** Render tabular numeric figures (useful for times, counts, dates). */
  tabular?: boolean;
};

/** Pill: small inline tag for dates, times, counts, status. */
export function Pill({
  children,
  variant = 'neutral',
  size = 'md',
  leading,
  tabular = false,
}: PillProps) {
  return (
    <span
      className={`ds-pill ds-pill--${variant} ds-pill--${size}${
        tabular ? ' ds-pill--tabular' : ''
      }`}
    >
      {leading !== undefined && <span className="ds-pill__leading">{leading}</span>}
      <span className="ds-pill__label">{children}</span>
    </span>
  );
}
