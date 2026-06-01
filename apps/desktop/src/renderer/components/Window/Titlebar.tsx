import type { ReactNode } from 'react';

type Props = {
  title?: string | undefined;
  /** Right-aligned chrome controls (appearance, settings). Buttons inside the
   * titlebar are automatically non-draggable (see global.css). */
  children?: ReactNode;
};

export default function Titlebar({ title, children }: Props) {
  return (
    <div className="titlebar">
      {/* Native macOS traffic lights are rendered by Electron (titleBarStyle: hiddenInset).
          No HTML lights here — that would double them up. */}
      {title && <div className="title-center">{title}</div>}
      {children && <div className="titlebar__controls">{children}</div>}
    </div>
  );
}
