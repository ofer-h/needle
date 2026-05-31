import {
  Button,
  Checkbox,
  Divider,
  Icon,
  Pill,
  ProgressBar,
  type IconName,
  type PillTone,
} from '@needle/ui-web';
import './screens.css';

const ICONS: IconName[] = [
  'check',
  'chevron',
  'plus',
  'spark',
  'calendar',
  'clock',
  'arrow',
  'bell',
  'x',
  'mic',
  'undo',
  'pin',
  'play',
  'pause',
  'dots',
  'grip',
  'sun',
  'moon',
  'coach',
  'chat',
  'layout',
];

const PILL_TONES: PillTone[] = ['neutral', 'urgent', 'upcoming', 'calendar', 'remember', 'gold'];

export function GalleryScreen() {
  return (
    <div className="screen">
      <h1 className="screen__title">Components</h1>
      <p className="screen__lede">
        Primitives from <code>@needle/ui-web</code> — semantic tokens only, both themes.
      </p>

      <section className="gallery-section">
        <h2 className="screen__subtitle">Button</h2>
        <div className="gallery-row">
          {(['primary', 'subtle', 'ghost'] as const).map((variant) =>
            (['sm', 'md', 'lg'] as const).map((size) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size}>
                {variant} {size}
              </Button>
            )),
          )}
        </div>
      </section>

      <section className="gallery-section">
        <h2 className="screen__subtitle">Checkbox</h2>
        <div className="gallery-row">
          <Checkbox label="Default" checked={false} onToggle={() => {}} />
          <Checkbox label="Checked" checked onToggle={() => {}} />
          <Checkbox label="Urgent" tone="urgent" checked onToggle={() => {}} />
        </div>
      </section>

      <section className="gallery-section">
        <h2 className="screen__subtitle">Pill</h2>
        <div className="gallery-row">
          {PILL_TONES.map((tone) => (
            <Pill key={tone} tone={tone}>
              {tone}
            </Pill>
          ))}
        </div>
      </section>

      <section className="gallery-section">
        <h2 className="screen__subtitle">Progress</h2>
        <ProgressBar value={5} max={8} label="Today" />
      </section>

      <Divider />

      <section className="gallery-section">
        <h2 className="screen__subtitle">Icons</h2>
        <div className="gallery-icons">
          {ICONS.map((name) => (
            <span key={name} className="gallery-icon" title={name}>
              <Icon name={name} size={18} />
              <span className="gallery-icon__label">{name}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
