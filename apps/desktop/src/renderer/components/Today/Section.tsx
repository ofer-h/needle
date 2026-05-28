import type { ReactNode } from 'react';

type Props = {
  title: string;
  date?: string;
  count?: number;
  accent?: string;
  children: ReactNode;
};

export default function Section({ title, date, count, accent, children }: Props) {
  return (
    <div className="t-section">
      <div className="t-section-head">
        <span className="t-section-title" style={accent ? { color: accent } : undefined}>
          {title}
        </span>
        {date && <span className="t-section-date">{date}</span>}
        {typeof count === 'number' && <span className="t-section-count">{count}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}
