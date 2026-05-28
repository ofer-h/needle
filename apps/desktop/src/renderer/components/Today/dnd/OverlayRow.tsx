import { Checkbox } from '../../primitives/Checkbox';
import { Pill } from '../../primitives/Pill';
import type { PillVariant } from '../../primitives/Pill';
import './OverlayRow.css';

type Kind = 'urgent' | 'upcoming' | 'faded';

type Props = {
  kind?: Kind;
  label: string;
  sublabel?: string;
  date: string;
  datePill?: 'urgent' | 'upcoming';
};

/** Pure display clone rendered inside `<DragOverlay>` — no DnD hooks. */
export default function OverlayRow({
  kind = 'urgent',
  label,
  sublabel,
  date,
  datePill,
}: Props) {
  const checkboxTone: 'neutral' | 'urgent' | 'upcoming' =
    kind === 'urgent' ? 'urgent' : kind === 'upcoming' ? 'upcoming' : 'neutral';

  return (
    <div className="t-row t-row-flexible overlay-row" role="listitem">
      <span className="overlay-row__handle" aria-hidden="true">
        ⠿
      </span>
      <Checkbox checked={false} tone={checkboxTone} label="" disabled />
      <div className="label">
        <span className={`priority-dot ${kind}`} aria-hidden="true" />
        <span>{label}</span>
        {sublabel !== undefined && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        <Pill variant={pillVariantFor(datePill)} tabular>
          {date}
        </Pill>
      </div>
    </div>
  );
}

function pillVariantFor(kind?: 'urgent' | 'upcoming'): PillVariant {
  if (kind === 'urgent') return 'urgent';
  if (kind === 'upcoming') return 'upcoming';
  return 'neutral';
}
