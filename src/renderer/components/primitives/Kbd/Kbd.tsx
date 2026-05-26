import type { ReactNode } from 'react';
import './Kbd.css';

type KbdProps = {
  children: ReactNode;
  size?: 'sm' | 'md';
  /** When true, renders without a background — useful inline in lighter contexts. */
  ghost?: boolean;
};

/** Keyboard shortcut hint. Renders monospaced inside a chip-style background. */
export function Kbd({ children, size = 'md', ghost = false }: KbdProps) {
  return (
    <span className={`ds-kbd ds-kbd--${size}${ghost ? ' ds-kbd--ghost' : ''}`}>{children}</span>
  );
}
