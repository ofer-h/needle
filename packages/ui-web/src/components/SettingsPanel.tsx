import { useState } from 'react';
import type { TransitionSettings, TransitionRule } from '../model/transition';
import { defaultTransitionSettings } from '../model/transition';
import type { NotificationConfig } from '../model/notify';
import { NotificationSettings } from './NotificationSettings';
import { Button } from '../primitives';
import './SettingsPanel.css';

export type SettingsPanelProps = {
  transition: TransitionSettings;
  onTransitionChange: (next: TransitionSettings) => void;
  notifications: NotificationConfig;
  onNotificationsChange: (next: NotificationConfig) => void;
};

/** Rebuild the `order` field so rules are numbered 0..n after reordering. */
function reindex(rules: TransitionRule[]): TransitionRule[] {
  return rules.map((r, i) => ({ ...r, order: i }));
}

function moveRule(rules: TransitionRule[], index: number, direction: 'up' | 'down'): TransitionRule[] {
  const copy = rules.map((r) => ({ ...r }));
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= copy.length) return copy;
  const a = copy[index];
  const b = copy[target];
  if (a === undefined || b === undefined) return copy;
  copy[index] = b;
  copy[target] = a;
  return reindex(copy);
}

function setEnabled(rules: TransitionRule[], index: number, enabled: boolean): TransitionRule[] {
  return rules.map((r, i) => (i === index ? { ...r, enabled } : { ...r }));
}

function setDuration(rules: TransitionRule[], index: number, minutes: number): TransitionRule[] {
  return rules.map((r, i) => (i === index ? { ...r, durationMinutes: minutes } : { ...r }));
}

export function SettingsPanel({
  transition,
  onTransitionChange,
  notifications,
  onNotificationsChange,
}: SettingsPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Sort by current `order` so the displayed list always reflects configured order.
  const sorted = transition.rules.slice().sort((a, b) => a.order - b.order);

  function handleToggle(sortedIndex: number) {
    const rule = sorted[sortedIndex];
    if (rule === undefined) return;
    const originalIndex = transition.rules.indexOf(rule);
    if (originalIndex === -1) return;
    onTransitionChange({
      ...transition,
      rules: setEnabled(transition.rules, originalIndex, !rule.enabled),
    });
  }

  function handleDuration(sortedIndex: number, raw: string) {
    const rule = sorted[sortedIndex];
    if (rule === undefined) return;
    const originalIndex = transition.rules.indexOf(rule);
    if (originalIndex === -1) return;
    const minutes = Math.max(0, parseInt(raw, 10) || 0);
    onTransitionChange({
      ...transition,
      rules: setDuration(transition.rules, originalIndex, minutes),
    });
  }

  function handleMove(sortedIndex: number, direction: 'up' | 'down') {
    // Work on the sorted array, then write back using the reindexed order values.
    const moved = moveRule(sorted, sortedIndex, direction);
    // Merge the new order values back into transition.rules by matching `kind`.
    const updatedRules = transition.rules.map((r) => {
      const updated = moved.find((m) => m.kind === r.kind);
      return updated !== undefined ? { ...r, order: updated.order } : { ...r };
    });
    onTransitionChange({ ...transition, rules: updatedRules });
  }

  function handleReset() {
    onTransitionChange(defaultTransitionSettings());
  }

  return (
    <div className="sp">
      {/* ── Transition System ──────────────────────────────────── */}
      <section className="sp__section" aria-labelledby="sp-transition-heading">
        <div className="sp__section-header">
          <h2 className="sp__heading" id="sp-transition-heading">
            Transition Ritual
          </h2>
          <p className="sp__subhead">
            The blocks that appear before each commitment. Drag to reorder, toggle to disable,
            adjust the minutes.
          </p>
        </div>

        <ol className="sp__rule-list" role="list">
          {sorted.map((rule, i) => (
            <li key={rule.kind} className={`sp__rule${rule.enabled ? '' : ' sp__rule--disabled'}`}>
              {/* Reorder controls */}
              <div className="sp__rule-reorder" aria-label={`Reorder ${rule.label}`}>
                <button
                  type="button"
                  className="sp__reorder-btn"
                  aria-label={`Move ${rule.label} up`}
                  disabled={i === 0}
                  onClick={() => handleMove(i, 'up')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="sp__reorder-btn"
                  aria-label={`Move ${rule.label} down`}
                  disabled={i === sorted.length - 1}
                  onClick={() => handleMove(i, 'down')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* Toggle */}
              <button
                type="button"
                className={`sp__rule-toggle${rule.enabled ? ' sp__rule-toggle--on' : ''}`}
                aria-pressed={rule.enabled}
                aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.label}`}
                onClick={() => handleToggle(i)}
              />

              {/* Label + hint */}
              <div className="sp__rule-body">
                <span className="sp__rule-label">{rule.label}</span>
                <span className="sp__rule-hint">{rule.hint}</span>
              </div>

              {/* Duration stepper */}
              <div className="sp__rule-duration" aria-label={`Duration for ${rule.label}`}>
                <button
                  type="button"
                  className="sp__step-btn"
                  aria-label={`Decrease ${rule.label} duration`}
                  disabled={rule.durationMinutes <= 0}
                  onClick={() => handleDuration(i, String(rule.durationMinutes - 1))}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <input
                  type="number"
                  className="sp__duration-input"
                  value={rule.durationMinutes}
                  min={0}
                  aria-label={`${rule.label} duration in minutes`}
                  onChange={(e) => handleDuration(i, e.target.value)}
                />
                <span className="sp__duration-unit">min</span>
                <button
                  type="button"
                  className="sp__step-btn"
                  aria-label={`Increase ${rule.label} duration`}
                  onClick={() => handleDuration(i, String(rule.durationMinutes + 1))}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ol>

        {/* Advanced: minCommitment */}
        <details className="sp__advanced" open={advancedOpen} onToggle={(e) => setAdvancedOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary className="sp__advanced-summary">
            <span className="sp__advanced-label">Advanced</span>
            <svg
              className={`sp__advanced-chevron${advancedOpen ? ' sp__advanced-chevron--open' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </summary>
          <div className="sp__advanced-body">
            <p className="sp__advanced-caption">
              Minimum commitment level required to activate each rule. “Unmissable” means only
              hard deadlines; “firm” includes planned events; “soft” applies everywhere.
            </p>
            <table className="sp__commit-table" aria-label="Minimum commitment per rule">
              <thead>
                <tr>
                  <th className="sp__commit-th">Rule</th>
                  <th className="sp__commit-th">Min commitment</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rule) => (
                  <tr key={rule.kind} className="sp__commit-row">
                    <td className="sp__commit-td">{rule.label}</td>
                    <td className="sp__commit-td">
                      <select
                        className="sp__commit-select"
                        value={rule.minCommitment}
                        aria-label={`Minimum commitment for ${rule.label}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'soft' && val !== 'firm' && val !== 'unmissable') return;
                          const updatedRules = transition.rules.map((r) =>
                            r.kind === rule.kind
                              ? { ...r, minCommitment: val as TransitionRule['minCommitment'] }
                              : { ...r },
                          );
                          onTransitionChange({ ...transition, rules: updatedRules });
                        }}
                      >
                        <option value="soft">Soft</option>
                        <option value="firm">Firm</option>
                        <option value="unmissable">Unmissable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <div className="sp__reset-row">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset to defaults
          </Button>
        </div>
      </section>

      <div className="sp__divider" role="separator" />

      {/* ── Notifications ──────────────────────────────────────── */}
      <section className="sp__section" aria-labelledby="sp-notifications-heading">
        <div className="sp__section-header">
          <h2 className="sp__heading" id="sp-notifications-heading">
            Notifications
          </h2>
          <p className="sp__subhead">When and how Needle nudges you.</p>
        </div>

        <NotificationSettings config={notifications} onChange={onNotificationsChange} />
      </section>
    </div>
  );
}
