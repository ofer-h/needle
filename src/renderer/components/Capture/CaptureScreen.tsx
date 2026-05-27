import { useState, useRef, useEffect, useCallback } from 'react';
import FxWindow from '../Window/FxWindow';
import type { ClassificationResult } from '../../../shared/types';
import { Button, Divider, Icon, Pill } from '../primitives';
import ApiKeySettings from './ApiKeySettings';
import './CaptureScreen.css';

type CaptureState = 'empty' | 'typing' | 'classifying' | 'classified' | 'classify-error' | 'voice';

const WAVE_BAR_COUNT = 40;

function bucketLabel(bucket: ClassificationResult['bucket']): string {
  const labels: Record<ClassificationResult['bucket'], string> = {
    today: 'Today',
    tomorrow: 'Tomorrow',
    later: 'Later',
    someday: 'Someday',
  };
  return labels[bucket];
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function bucketPillVariant(bucket: ClassificationResult['bucket']): 'urgent' | 'upcoming' {
  return bucket === 'today' || bucket === 'tomorrow' ? 'urgent' : 'upcoming';
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

function CaptureClassifyError({
  rawInput,
  message,
  onRetry,
  onSaveRemember,
  onOpenApiKey,
}: {
  rawInput: string;
  message: string;
  onRetry: () => void;
  onSaveRemember: () => void;
  onOpenApiKey: () => void;
}) {
  return (
    <div className="capture-panel-enter">
      <Prompt>Something went wrong</Prompt>
      <div className="capture-content">
        <div className="composer capture-composer--compact">
          <div className="input-text capture-composer__recap">{rawInput}</div>
        </div>
        <div className="result-card capture-result">
          <p className="capture-result__subtitle" style={{ color: 'var(--urgent)' }}>
            {message}
          </p>
          <div className="capture-feedback" style={{ marginTop: 16 }}>
            <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
              Try again
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onOpenApiKey}>
              API key
            </Button>
            <Button type="button" variant="subtle" size="sm" onClick={onSaveRemember}>
              Save as Remember
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaptureClassified({
  rawInput,
  result,
  latencyMs,
  onAddAnother,
  onBack,
}: {
  rawInput: string;
  result: ClassificationResult;
  latencyMs: number;
  onAddAnother: () => void;
  onBack: () => void;
}) {
  const chipIndex = TIME_CHIPS.findIndex(
    (c) => c.toLowerCase() === bucketLabel(result.bucket).toLowerCase(),
  );
  const [selectedChip, setSelectedChip] = useState(chipIndex >= 0 ? chipIndex : 0);

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
            <Pill variant={bucketPillVariant(result.bucket)} size="sm">
              {bucketLabel(result.bucket)}
            </Pill>
            <span className="capture-result__meta" />
            <span className="capture-result__timing t-mono">{formatLatency(latencyMs)}</span>
          </div>

          <h2 className="capture-result__title">{result.title}</h2>
          <p className="capture-result__subtitle">{result.reasoning}</p>

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
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  const footer: Record<CaptureState, string> = {
    empty: '⌘ K captures from anywhere on your Mac',
    typing: '⏎ to confirm · ⎋ to dismiss',
    classifying: 'classifying with Claude…',
    classified: 'thumbs up to save · ↩ or wait 3s to return',
    'classify-error': 'fix the issue or save without classification',
    voice: 'tap to stop · auto-stops on silence',
  };

  const runClassify = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setClassifyError(null);
    setClassification(null);
    setState('classifying');

    const started = performance.now();
    const response = await window.api.ai.classify(trimmed);
    const elapsed = performance.now() - started;
    setLatencyMs(elapsed);

    if ('error' in response) {
      setClassifyError(response.error);
      setState('classify-error');
      return;
    }

    setClassification(response);
    setState('classified');
  }, []);

  const handleStartTyping = (v: string) => {
    setInputValue(v);
    setState('typing');
  };

  const handleSubmit = () => {
    if (inputValue.trim()) void runClassify(inputValue);
  };

  const handleAddAnother = () => {
    setInputValue('');
    setClassification(null);
    setClassifyError(null);
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
        {state === 'classify-error' && classifyError !== null && (
          <CaptureClassifyError
            rawInput={inputValue}
            message={classifyError}
            onRetry={() => void runClassify(inputValue)}
            onSaveRemember={onBack}
            onOpenApiKey={() => setApiKeyOpen(true)}
          />
        )}
        {state === 'classified' && classification !== null && (
          <CaptureClassified
            rawInput={inputValue}
            result={classification}
            latencyMs={latencyMs}
            onAddAnother={handleAddAnother}
            onBack={onBack}
          />
        )}
        {state === 'voice' && (
          <CaptureVoice
            onStop={() =>
              void runClassify(
                inputValue.trim() || 'need to prep for the one on one with my manager on thursday',
              )
            }
            onCancel={() => setState('empty')}
          />
        )}

        <ApiKeySettings open={apiKeyOpen} onClose={() => setApiKeyOpen(false)} />

        <footer className="capture-footer">
          <span className="capture-footer__hint t-mono">{footer[state]}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="capture-footer__api-key"
            onClick={() => setApiKeyOpen(true)}
          >
            API key
          </Button>
        </footer>
      </div>
    </FxWindow>
  );
}
