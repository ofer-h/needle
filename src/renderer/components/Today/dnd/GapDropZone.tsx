import { useDroppable } from '@dnd-kit/core';
import './GapDropZone.css';

type Props = {
  id: string;
  /** When true the zone stays in the DOM (preserving layout) but won't accept drops. */
  disabled?: boolean;
};

/** Drop pocket between consecutive timeline items. Fixed outer height — never
 * causes layout shift when adjacent zones toggle disabled. */
export default function GapDropZone({ id, disabled = false }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  const active = isOver && !disabled;
  return (
    <div ref={setNodeRef} className={`gap-dropzone${active ? ' gap-dropzone--active' : ''}`}>
      <div className="gap-dropzone__indicator" aria-hidden="true" />
    </div>
  );
}
