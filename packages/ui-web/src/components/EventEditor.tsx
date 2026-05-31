import { useState } from 'react';
import type { ItemId } from '../model';
import type { NewEventInput } from '../model/mutate';
import { Button, Checkbox, Icon } from '../primitives';
import './EventEditor.css';

type CommitmentChip = { value: 'soft' | 'firm' | 'unmissable'; label: string };

const CHIPS: CommitmentChip[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'firm', label: 'Committed' },
  { value: 'unmissable', label: 'Unmissable' },
];

type Props = {
  onCreate: (input: NewEventInput) => ItemId;
  onAddPrep: (eventId: ItemId, opts: { travelMinutes: number; bufferMinutes?: number }) => void;
};

/** Create a fixed event / alarm — title, time window, commitment level, and an
 * optional travel-prep flow. For unmissable place-events (e.g. school pickup)
 * the travel toggle auto-adds a "leave by …" hard stop anchored before the
 * event start. */
export function EventEditor({ onCreate, onAddPrep }: Props) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [commitment, setCommitment] = useState<'soft' | 'firm' | 'unmissable'>('firm');
  const [travel, setTravel] = useState(false);
  const [travelMinutes, setTravelMinutes] = useState(20);
  const [bufferMinutes, setBufferMinutes] = useState(5);

  const canSubmit = title.trim().length > 0 && startTime.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const input: NewEventInput = {
      title: title.trim(),
      startTime,
      ...(endTime ? { endTime } : {}),
      ...(commitment !== 'firm' ? { commitmentLevel: commitment } : { commitmentLevel: 'firm' }),
    };

    const id = onCreate(input);

    if (travel) {
      onAddPrep(id, {
        travelMinutes,
        ...(bufferMinutes > 0 ? { bufferMinutes } : {}),
      });
    }

    // Reset to defaults
    setTitle('');
    setStartTime('');
    setEndTime('');
    setCommitment('firm');
    setTravel(false);
    setTravelMinutes(20);
    setBufferMinutes(5);
  };

  return (
    <div className="event-editor">
      <p className="event-editor__hint">
        <Icon name="bell" size={13} tone="upcoming" />
        Marking an event <strong>Unmissable</strong> and turning on travel time will auto-add a
        &ldquo;leave by&rdquo; hard stop before it starts — great for school pickups and any
        place you have to physically reach.
      </p>

      {/* Title */}
      <div className="event-editor__field">
        <label className="event-editor__label" htmlFor="ee-title">
          Event name
        </label>
        <input
          id="ee-title"
          className="event-editor__input"
          type="text"
          value={title}
          placeholder="e.g. School pickup"
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Times */}
      <div className="event-editor__row">
        <div className="event-editor__field event-editor__field--time">
          <label className="event-editor__label" htmlFor="ee-start">
            Start time
          </label>
          <div className="event-editor__time-wrap">
            <Icon name="clock" size={13} tone="muted" />
            <input
              id="ee-start"
              className="event-editor__time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              aria-required="true"
            />
          </div>
        </div>

        <div className="event-editor__field event-editor__field--time">
          <label className="event-editor__label" htmlFor="ee-end">
            End time <span className="event-editor__optional">(optional)</span>
          </label>
          <div className="event-editor__time-wrap">
            <Icon name="clock" size={13} tone="muted" />
            <input
              id="ee-end"
              className="event-editor__time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Commitment chips */}
      <div className="event-editor__field">
        <span className="event-editor__label" id="ee-commitment-label">
          Commitment
        </span>
        <div className="event-editor__chips" role="group" aria-labelledby="ee-commitment-label">
          {CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={`event-editor__chip${commitment === chip.value ? ' event-editor__chip--on' : ''}${chip.value === 'unmissable' ? ' event-editor__chip--unmissable' : ''}`}
              onClick={() => setCommitment(chip.value)}
              aria-pressed={commitment === chip.value}
            >
              {chip.value === 'unmissable' && (
                <Icon
                  name="pin"
                  size={12}
                  tone={commitment === 'unmissable' ? 'urgent' : 'muted'}
                />
              )}
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Travel toggle */}
      <div className="event-editor__travel-toggle">
        <Checkbox
          checked={travel}
          onToggle={() => setTravel((v) => !v)}
          label="This is a place I travel to"
          tone="neutral"
        />
        <span className="event-editor__travel-label">This is a place I travel to</span>
      </div>

      {/* Travel detail panel */}
      {travel && (
        <div className="event-editor__travel-panel" aria-live="polite">
          <p className="event-editor__travel-hint">
            A &ldquo;leave by&rdquo; hard stop will be added automatically before your event.
          </p>

          <div className="event-editor__row">
            <div className="event-editor__field event-editor__field--number">
              <label className="event-editor__label" htmlFor="ee-travel">
                Travel time (min)
              </label>
              <input
                id="ee-travel"
                className="event-editor__number"
                type="number"
                min={1}
                max={240}
                value={travelMinutes}
                onChange={(e) => setTravelMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            <div className="event-editor__field event-editor__field--number">
              <label className="event-editor__label" htmlFor="ee-buffer">
                Buffer <span className="event-editor__optional">(optional, min)</span>
              </label>
              <input
                id="ee-buffer"
                className="event-editor__number"
                type="number"
                min={0}
                max={60}
                value={bufferMinutes}
                onChange={(e) =>
                  setBufferMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="event-editor__footer">
        <Button
          variant="primary"
          size="md"
          disabled={!canSubmit}
          onClick={handleSubmit}
          leadingIcon={<Icon name="calendar" size={14} tone="inherit" />}
        >
          Add event
        </Button>
      </div>
    </div>
  );
}
