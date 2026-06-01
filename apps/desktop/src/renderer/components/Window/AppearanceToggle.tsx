import type { ReactNode } from 'react';
import type { Appearance } from '../../state/store';
import './AppearanceToggle.css';

type Props = {
  value: Appearance;
  onChange: (next: Appearance) => void;
};

function SunIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
      </g>
    </svg>
  );
}

function MoonIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon(): ReactNode {
  // Half-filled circle: the "auto / follow system" convention.
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" />
    </svg>
  );
}

const OPTIONS: ReadonlyArray<{ id: Appearance; label: string; icon: ReactNode }> = [
  { id: 'light', label: 'Light', icon: <SunIcon /> },
  { id: 'system', label: 'System', icon: <SystemIcon /> },
  { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
];

/** Segmented light / system / dark control for the titlebar. Three glyphs,
 * always visible — the resolved theme follows `system` or the explicit pick. */
export default function AppearanceToggle({ value, onChange }: Props) {
  return (
    <div className="appearance-toggle" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          aria-label={opt.label}
          title={opt.label}
          className={`appearance-toggle__seg${
            value === opt.id ? ' appearance-toggle__seg--on' : ''
          }`}
          onClick={() => onChange(opt.id)}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
