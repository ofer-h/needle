import { type ReactNode } from 'react';
import './GlassBubbleMat.css';

export type GlassBubbleMatProps = {
  children?: ReactNode;
  className?: string;
};

export function GlassBubbleMat({ children, className }: GlassBubbleMatProps) {
  const combinedClass = ['gbm', ...(className !== undefined ? [className] : [])].join(' ');

  return <div className={combinedClass}>{children}</div>;
}
