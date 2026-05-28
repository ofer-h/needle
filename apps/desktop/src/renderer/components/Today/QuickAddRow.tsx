import type { KeyboardEvent } from 'react';
import { Icon } from '../primitives/Icon';
import { Kbd } from '../primitives/Kbd';
import './QuickAddRow.css';

type Props = {
  onActivate: () => void;
};

export default function QuickAddRow({ onActivate }: Props) {
  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  }

  return (
    <div
      className="quickadd"
      onClick={onActivate}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      aria-label="Open capture composer"
    >
      <span className="quickadd__bubble" aria-hidden="true">
        <Icon name="plus" size={10} tone="inherit" />
      </span>
      <span className="quickadd__text">
        Add a task, paste anything, or hit&nbsp;
        <Kbd size="sm">⌘ N</Kbd>
      </span>
    </div>
  );
}
