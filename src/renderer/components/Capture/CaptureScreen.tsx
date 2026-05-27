import { useState, useRef, useEffect } from 'react';
import FxWindow from '../Window/FxWindow';
import { Button, Divider, Icon, Pill } from '../primitives';
import './CaptureScreen.css';

type CaptureState = 'empty' | 'typing' | 'classifying' | 'classified' | 'voice';

type CaptureClassification = {
  bucket: 'act' | 'remember';
  title: string;
  suggestedDate?: string;
  reasoning: string;
};

const CLASSIFY_MS = 1500;
const WAVE_BAR_COUNT = 40;

const MOCK_CLASSIFICATION: CaptureClassification = {
  bucket: 'act',
  title: 'Prep for manager 1:1',
  suggestedDate: 'Today',
  reasoning: 'Linked to your Thursday 3 PM meeting · 2 hr lead',
};

function formatBucketLabel(bucket: CaptureClassification['bucket'], suggestedDate?: string): string {
  const name = bucket === 'act' ? 'Act' : 'Remember';
  if (bucket === 'act' && suggestedDate) {
    return `${name} · ${suggestedDate}`;
  }
  return name;
}

type Props = {
  onBack: () => void;
};

const TIME_CHIPS = ['Today', 'Tomorrow', 'In a few days', 'Next Sun', 'Next week', 'Someday', 'Pick date…'];

function BackNav({ onBack }: { onBack: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="capture-back"
      onClick={onBack}
      leadingIcon={<Icon name="back" size={13} tone="muted" />}
    >
      Today
    </Button>
  );
}

function Prompt({
  children = "What's on your mind?",
  icon = 'spark',
}: {
  children?: string;
  icon?: 'spark' | 'mic';
}) {
  return (
    <div className="capture-prompt">
      <div
        className={`capture-prompt__icon${icon === 'mic' ? ' capture-prompt__icon--urgent' : ''}`}
      >
        <Icon name={icon} size={icon === 'mic' ? 20 : 15} tone={icon === 'mic' ? 'urgent' : 'default'} />
      </div>
      <h1 className="capture-prompt__title t-display">{children}</h1>
    </div>
  );
}

function ModeButtons({ onVoice }: { onVoice?: () => void }) {
  return (
    <div className="capture-mode-row">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        leadingIcon={<Icon name="mic" size={13} tone="muted" />}
        onClick={onVoice}
      >
        Voice
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        leadingIcon={<Icon name="paperclip" size={13} tone="muted" />}
      >
        Drop / paste a file
      </Button>
    </div>
  );
}

function CaptureEmpty({
  onStartTyping,
  onStartVoice,
}: {
  onStartTyping: (v: string) => void;
  onStartVoice: () => void;
}) {
  return (
    <div className="capture-panel-enter">
      <Prompt />
      <div className="capture-content">
        <div className="composer">
          <div
            className="input-text empty capture-input-empty"
            role="button"
            tabIndex={0}
            onClick={() => onStartTyping('')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStartTyping('');
              }
            }}
          >
            Type, paste, drop, or hit voice…<span className="caret-bar" />
          </div>
        </div>
        <ModeButtons onVoice={onStartVoice} />
      </div>
    </div>
  );
}

function CaptureTyping({
  value,
  onChange,
  onSubmit,
  onStartVoice,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStartVoice: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="capture-panel-enter">
      <Prompt />
      <div className="capture-content">
        <div className="composer">
          <textarea
            ref={textareaRef}
            className="capture-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder=""
            aria-label="Capture text"
          />
        </div>
        <ModeButtons onVoice={onStartVoice} />
      </div>
    </div>
  );
}

function CaptureClassifying({ rawInput }: { rawInput: string }) {
  return (
    <div className="capture-panel-enter">
      <Prompt>Reading your capture…</Prompt>
      <div className="capture-content">
        <div className="composer capture-composer--compact">
          <div className="input-text capture-composer__recap">{rawInput}</div>
        </div>
        <div className="composer capture-composer--compact">
          <div className="capture-classifying" aria-live="polite" aria-busy="true">
            <div className="thinking capture-classifying__status">
              <i />
              <i />
              <i />
              <span className="capture-classifying__status-label">classifying</span>
            </div>
            <p className="capture-classifying__body">
              Matching to your calendar and today&apos;s plan…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaptureClassified({
  rawInput,
  result,
  onAddAnother,
  onBack,
}: {
  rawInput: string;
  result: CaptureClassification;
  onAddAnother: () => void;
  onBack: () => void;
}) {
  const [selectedChip, setSelectedChip] = useState(0);
  const pillVariant = result.bucket === 'act' ? 'urgent' : 'upcoming';

  return (
    <div className="capture-panel-enter">
      <Prompt />
      <div className="capture-content">
        <div className="composer capture-composer--compact">
          <div className="input-text capture-composer__recap">{rawInput}</div>
        </div>

        <div className="result-card capture-result">
          <div className="capture-result__header">
            <Icon name="spark" size={12} tone="default" />
            <Pill variant={pillVariant} size="sm">
              {formatBucketLabel(result.bucket, result.suggestedDate)}
            </Pill>
            <span className="capture-result__meta" />
            <span className="capture-result__timing t-mono">
              {(CLASSIFY_MS / 1000).toFixed(1)} s
            </span>
          </div>

          <h2 className="capture-result__title">{result.title}</h2>
          <p className="capture-result__subtitle">{result.reasoning}</p>

          {result.bucket === 'act' && (
            <div className="capture-time-chips" role="listbox" aria-label="Schedule">
              {TIME_CHIPS.map((chip, i) => (
                <button
                  key={chip}
                  type="button"
                  role="option"
                  aria-selected={i === selectedChip}
                  className={`capture-time-chip${i === selectedChip ? ' capture-time-chip--selected' : ''}`}
                  onClick={() => setSelectedChip(i)}
                >
                  {i === selectedChip && <Icon name="check" size={11} tone="inherit" />}
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div className="capture-result__divider">
            <Divider />
          </div>

          <div className="capture-feedback">
            <Button
              type="button"
              variant="subtle"
              size="sm"
              className="capture-btn-positive"
              leadingIcon={<Icon name="thumbs-up" size={13} tone="inherit" />}
              onClick={onBack}
            >
              Looks right
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={<Icon name="thumbs-down" size={13} tone="muted" />}
            >
              Change this
            </Button>
            <span className="capture-feedback__spacer" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={<Icon name="plus" size={11} tone="muted" />}
              onClick={onAddAnother}
            >
              Add another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaptureVoice({ onStop, onCancel }: { onStop: () => void; onCancel: () => void }) {
  return (
    <div className="capture-panel-enter">
      <Prompt icon="mic">I&apos;m listening…</Prompt>

      <div className="capture-content">
        <div className="composer capture-composer--voice">
          <div className="capture-wave" aria-hidden="true">
            {Array.from({ length: WAVE_BAR_COUNT }, (_, i) => (
              <i key={i} className="capture-wave__bar" />
            ))}
          </div>
        </div>

        <p className="capture-voice-transcript">
          &ldquo;need to prep for the one on one with my manager on thursday
          <span className="caret-bar" />&rdquo;
        </p>

        <div className="capture-voice-actions">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="capture-btn-stop"
            leadingIcon={<span className="capture-stop-dot" aria-hidden="true" />}
            onClick={onStop}
          >
            Stop &amp; classify
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CaptureScreen({ onBack }: Props) {
  const [state, setState] = useState<CaptureState>('empty');
  const [inputValue, setInputValue] = useState('');
  const [classification, setClassification] = useState<CaptureClassification | null>(null);

  const footer: Record<CaptureState, string> = {
    empty: '⌘ K captures from anywhere on your Mac',
    typing: '⏎ to confirm · ⎋ to dismiss',
    classifying: 'Needle is reading your capture…',
    classified: 'thumbs up to save · ↩ or wait 3s to return',
    voice: 'tap to stop · auto-stops on silence',
  };

  useEffect(() => {
    if (state !== 'classifying') return;
    const timer = window.setTimeout(() => {
      setClassification(MOCK_CLASSIFICATION);
      setState('classified');
    }, CLASSIFY_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const handleStartTyping = (v: string) => {
    setInputValue(v);
    setState('typing');
  };

  const handleSubmit = () => {
    if (inputValue.trim()) setState('classifying');
  };

  const handleAddAnother = () => {
    setInputValue('');
    setClassification(null);
    setState('empty');
  };

  return (
    <FxWindow title="Capture">
      <div className="capture-shell">
        <BackNav onBack={onBack} />

        {state === 'empty' && (
          <CaptureEmpty
            onStartTyping={handleStartTyping}
            onStartVoice={() => setState('voice')}
          />
        )}
        {state === 'typing' && (
          <CaptureTyping
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStartVoice={() => setState('voice')}
          />
        )}
        {state === 'classifying' && <CaptureClassifying rawInput={inputValue} />}
        {state === 'classified' && classification !== null && (
          <CaptureClassified
            rawInput={inputValue}
            result={classification}
            onAddAnother={handleAddAnother}
            onBack={onBack}
          />
        )}
        {state === 'voice' && (
          <CaptureVoice
            onStop={() => {
              const text =
                inputValue.trim() || 'need to prep for the one on one with my manager on thursday';
              setInputValue(text);
              setState('classifying');
            }}
            onCancel={() => setState('empty')}
          />
        )}

        <footer className="capture-footer">
          <span className="capture-footer__hint t-mono">{footer[state]}</span>
        </footer>
      </div>
    </FxWindow>
  );
}
