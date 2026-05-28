import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './IconButton.css';

export type IconButtonVariant = 'ghost' | 'subtle';
export type IconButtonSize = 'sm' | 'md';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  children: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Only show on hover of an ancestor with `.ds-hover-reveal` — used for drag handles. */
  hoverReveal?: boolean;
};

/** Icon-only trigger. Always requires an accessible `label`. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  {
    children,
    label,
    variant = 'ghost',
    size = 'md',
    hoverReveal = false,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={`ds-icon-btn ds-icon-btn--${variant} ds-icon-btn--${size}${
        hoverReveal ? ' ds-icon-btn--hover-reveal' : ''
      }${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
});
