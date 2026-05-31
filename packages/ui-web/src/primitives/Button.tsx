import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
};

/** Text button. Ported from the desktop primitive. */
export function Button({
  children,
  variant = 'subtle',
  size = 'md',
  leadingIcon,
  trailing,
  block = false,
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`ds-btn ds-btn--${variant} ds-btn--${size}${block ? ' ds-btn--block' : ''}${
        className ? ` ${className}` : ''
      }`}
      {...rest}
    >
      {leadingIcon !== undefined && <span className="ds-btn__lead">{leadingIcon}</span>}
      <span className="ds-btn__label">{children}</span>
      {trailing !== undefined && <span className="ds-btn__trail">{trailing}</span>}
    </button>
  );
}
