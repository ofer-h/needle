import { IconCal } from '../Icons';

type Props = {
  startTime: string;
  label: string;
  sublabel?: string;
};

export default function EventRow({ startTime, label, sublabel }: Props) {
  return (
    <div className="t-row event" role="listitem">
      {/* Drag handle placeholder — keeps columns aligned with task rows */}
      <span style={{ width: 20, flexShrink: 0, visibility: 'hidden' }} aria-hidden="true" />
      <div
        style={{
          width: 22,
          height: 22,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--calendar)',
        }}
      >
        <IconCal size={14} />
      </div>
      <div className="label">
        <span style={{ color: 'var(--ink-2)', fontWeight: 450 }}>{label}</span>
        {sublabel && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        <span
          className="pill"
          style={{
            background: 'transparent',
            border: '0.5px solid var(--hairline-2)',
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {startTime}
        </span>
      </div>
    </div>
  );
}
