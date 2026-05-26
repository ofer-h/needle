import { Icon } from '../primitives/Icon';
import { Pill } from '../primitives/Pill';

type Props = {
  startTime: string;
  label: string;
  sublabel?: string;
};

export default function EventRow({ startTime, label, sublabel }: Props) {
  return (
    <div className="t-row event" role="listitem">
      <span className="t-row__handle-placeholder" aria-hidden="true" />
      <span className="t-row__event-icon">
        <Icon name="calendar" size={14} tone="calendar" />
      </span>
      <div className="label">
        <span className="t-row__event-label">{label}</span>
        {sublabel !== undefined && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        <Pill variant="outline" tabular>
          {startTime}
        </Pill>
      </div>
    </div>
  );
}
