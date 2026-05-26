import './Divider.css';

type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'subtle' | 'strong' | 'dotted';
  /** Inset on both ends. Useful inside cards/sections. */
  inset?: number;
  decorative?: boolean;
};

/** Hairline divider. Defaults to horizontal/subtle, matching macOS list separators. */
export function Divider({
  orientation = 'horizontal',
  variant = 'subtle',
  inset = 0,
  decorative = true,
}: DividerProps) {
  const ariaProps = decorative ? { 'aria-hidden': true } : { role: 'separator' };
  const style = inset > 0 ? { marginInline: inset } : undefined;
  return (
    <span
      className={`ds-divider ds-divider--${orientation} ds-divider--${variant}`}
      {...ariaProps}
      {...(style ? { style } : {})}
    />
  );
}
