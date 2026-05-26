import { Icon } from '../primitives/Icon';
import { Kbd } from '../primitives/Kbd';
import './CaptureFab.css';

type Props = {
  onClick: () => void;
};

/** Floating action button to open the capture composer. */
export default function CaptureFab({ onClick }: Props) {
  return (
    <button
      type="button"
      className="capture-fab"
      onClick={onClick}
      aria-label="New capture"
      aria-keyshortcuts="Meta+K"
    >
      <span className="capture-fab__ic" aria-hidden="true">
        <Icon name="plus" size={14} tone="inherit" />
      </span>
      <span>Capture</span>
      <Kbd size="sm" ghost>
        ⌘ K
      </Kbd>
    </button>
  );
}
