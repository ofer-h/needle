import type { ReactNode } from 'react';
import Titlebar from './Titlebar';

type Props = {
  title?: string | undefined;
  children: ReactNode;
};

export default function FxWindow({ title, children }: Props) {
  return (
    <div className="win">
      <Titlebar title={title} />
      <div className="body">{children}</div>
    </div>
  );
}
