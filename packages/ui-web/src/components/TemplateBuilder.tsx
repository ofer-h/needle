import { useState } from 'react';
import type { AccentName, Density, Grouping, ItemField, SortBy, Template } from '../model/template';
import { Button, Checkbox } from '../primitives';
import './TemplateBuilder.css';

type BaseLayout = Exclude<Template['layout'], 'custom'>;

const BASE_LAYOUTS: { value: BaseLayout; label: string }[] = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'compact', label: 'Compact' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'kanban', label: 'Kanban' },
];

const DENSITIES: { value: Density; label: string }[] = [
  { value: 'roomy', label: 'Roomy' },
  { value: 'cozy', label: 'Cozy' },
  { value: 'compact', label: 'Compact' },
];

const ACCENTS: { value: AccentName; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'remember', label: 'Remember' },
  { value: 'accent', label: 'Accent' },
  { value: 'calendar', label: 'Calendar' },
];

const ITEM_FIELDS: { value: ItemField; label: string }[] = [
  { value: 'time', label: 'Time' },
  { value: 'duration', label: 'Duration' },
  { value: 'commitment', label: 'Commitment' },
  { value: 'source', label: 'Source' },
  { value: 'tags', label: 'Tags' },
  { value: 'progress', label: 'Progress' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'time', label: 'By time' },
  { value: 'priority', label: 'By priority' },
  { value: 'manual', label: 'Manual' },
];

const GROUPINGS: { value: Grouping; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'timeOfDay', label: 'Time of day' },
  { value: 'commitment', label: 'Commitment' },
  { value: 'status', label: 'Status' },
];

function groupingLabel(g: Grouping): string {
  switch (g) {
    case 'none':
      return 'ungrouped';
    case 'timeOfDay':
      return 'grouped by time of day';
    case 'commitment':
      return 'grouped by commitment';
    case 'status':
      return 'grouped by status';
  }
}

function slugify(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'custom';
}

type Props = {
  onSave: (template: Template) => void;
  onCancel?: () => void;
};

export function TemplateBuilder({ onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [baseLayout, setBaseLayout] = useState<BaseLayout>('editorial');
  const [density, setDensity] = useState<Density>('cozy');
  const [accent, setAccent] = useState<AccentName>('upcoming');
  const [fieldsShown, setFieldsShown] = useState<ItemField[]>(['time', 'commitment']);
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [grouping, setGrouping] = useState<Grouping>('timeOfDay');
  const [showProgress, setShowProgress] = useState(true);
  const [showCountdown, setShowCountdown] = useState(true);

  const canSave = name.trim().length > 0;

  function toggleField(field: ItemField) {
    setFieldsShown((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }

  function handleSave() {
    if (!canSave) return;
    const template: Template = {
      id: slugify(name),
      name: name.trim(),
      layout: 'custom',
      baseLayout,
      density,
      fieldsShown,
      accent,
      sortBy,
      grouping,
      showProgress,
      showCountdown,
      custom: true,
    };
    onSave(template);
  }

  const summaryAccent = ACCENTS.find((a) => a.value === accent)?.label.toLowerCase() ?? accent;
  const summaryLayout = BASE_LAYOUTS.find((l) => l.value === baseLayout)?.label.toLowerCase() ?? baseLayout;
  const summaryDensity = DENSITIES.find((d) => d.value === density)?.label.toLowerCase() ?? density;
  const summaryGrouping = groupingLabel(grouping);
  const liveSummary = `A ${summaryDensity} ${summaryLayout} board, ${summaryGrouping}, accented ${summaryAccent}.`;

  return (
    <div className="tb">
      {/* Name */}
      <section className="tb__section">
        <span className="tb__eyebrow">Template name</span>
        <input
          id="tb-name"
          className="tb__text-input"
          type="text"
          value={name}
          placeholder="e.g. Focus sprint"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <div className="tb__divider" role="separator" />

      {/* Base layout */}
      <section className="tb__section">
        <span className="tb__eyebrow">Base layout</span>
        <p className="tb__caption">Which built-in renderer to drive.</p>
        <div className="tb__chips" role="group" aria-label="Base layout">
          {BASE_LAYOUTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tb__chip${baseLayout === opt.value ? ' tb__chip--on' : ''}`}
              aria-pressed={baseLayout === opt.value}
              onClick={() => setBaseLayout(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Density */}
      <section className="tb__section">
        <span className="tb__eyebrow">Density</span>
        <div className="tb__chips" role="group" aria-label="Density">
          {DENSITIES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tb__chip${density === opt.value ? ' tb__chip--on' : ''}`}
              aria-pressed={density === opt.value}
              onClick={() => setDensity(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Accent */}
      <section className="tb__section">
        <span className="tb__eyebrow">Accent colour</span>
        <p className="tb__caption">Sets the highlight tone across rows and indicators.</p>
        <div className="tb__chips tb__chips--accent" role="group" aria-label="Accent colour">
          {ACCENTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tb__chip tb__chip--swatch${accent === opt.value ? ' tb__chip--on' : ''}`}
              aria-pressed={accent === opt.value}
              onClick={() => setAccent(opt.value)}
            >
              <span
                className="tb__swatch"
                aria-hidden="true"
                style={{ background: `var(--${opt.value})` }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Fields shown */}
      <section className="tb__section">
        <span className="tb__eyebrow">Fields shown</span>
        <p className="tb__caption">Which optional fields appear on each row.</p>
        <ul className="tb__check-list" role="list">
          {ITEM_FIELDS.map((field) => {
            const checked = fieldsShown.includes(field.value);
            return (
              <li key={field.value} className="tb__check-row">
                <Checkbox
                  checked={checked}
                  onToggle={() => toggleField(field.value)}
                  label={field.label}
                  tone="neutral"
                />
                <span className="tb__check-label">{field.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Sort */}
      <section className="tb__section">
        <span className="tb__eyebrow">Sort by</span>
        <div className="tb__chips" role="group" aria-label="Sort order">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tb__chip${sortBy === opt.value ? ' tb__chip--on' : ''}`}
              aria-pressed={sortBy === opt.value}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Grouping */}
      <section className="tb__section">
        <span className="tb__eyebrow">Grouping</span>
        <div className="tb__chips" role="group" aria-label="Row grouping">
          {GROUPINGS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tb__chip${grouping === opt.value ? ' tb__chip--on' : ''}`}
              aria-pressed={grouping === opt.value}
              onClick={() => setGrouping(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Show progress / countdown */}
      <section className="tb__section tb__section--row">
        <div className="tb__check-row">
          <Checkbox
            checked={showProgress}
            onToggle={() => setShowProgress((v) => !v)}
            label="Show progress bar"
            tone="neutral"
          />
          <span className="tb__check-label">Show progress bar</span>
        </div>
        <div className="tb__check-row">
          <Checkbox
            checked={showCountdown}
            onToggle={() => setShowCountdown((v) => !v)}
            label="Show countdown"
            tone="neutral"
          />
          <span className="tb__check-label">Show countdown</span>
        </div>
      </section>

      <div className="tb__divider" role="separator" />

      {/* Live summary */}
      <section className="tb__section">
        <p className="tb__summary" aria-live="polite" aria-atomic="true">
          {liveSummary}
        </p>
      </section>

      {/* Footer */}
      <div className="tb__footer">
        {onCancel !== undefined && (
          <Button variant="ghost" size="md" onClick={() => onCancel()}>
            Cancel
          </Button>
        )}
        <Button variant="primary" size="md" disabled={!canSave} onClick={handleSave}>
          Save template
        </Button>
      </div>
    </div>
  );
}
