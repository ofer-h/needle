import { IconCal } from '../Icons';

type Props = {
  time: string;
  label: string;
  sublabel?: string;
};

export default function EventRow({ time, label, sublabel }: Props) {
  return (
    <div className="t-row event" role="listitem">
      <div
        style={{
          width: 18,
          height: 18,
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
          {time}
        </span>
      </div>
    </div>
  );
}
