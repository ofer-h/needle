import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import FxWindow from '../Window/FxWindow';
import { useTasks } from '../../hooks/useTasks';
import type { CaptureResult, Task, TimeSlot } from '../../../shared/types';
import {
  IconBack,
  IconMic,
  IconPaperclip,
  IconCheck,
  IconThumbsUp,
  IconThumbsDown,
  IconPlus,
  IconSpark,
} from '../Icons';

type CaptureState = 'typing' | 'classifying' | 'classified' | 'voice';

function isTextEntryTarget(el: EventTarget | null, textarea: HTMLTextAreaElement | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el === textarea) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

type Props = {
  onBack: () => void;
};

const TIME_CHIPS = ['Today', 'Tomorrow', 'In a few days', 'Next Sun', 'Next week', 'Someday', 'Pick date…'];

const TIME_SLOT_CHIP_INDEX: Record<TimeSlot, number> = {
  today: 0,
  tomorrow: 1,
  'in-a-few-days': 2,
  'next-week': 4,
  someday: 5,
};

const BUCKET_LABELS = {
  act: 'Act',
  remember: 'Remember',
} as const;

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  'in-a-few-days': 'In a few days',
  'next-week': 'Next week',
  someday: 'Someday',
};

function BackNav({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--ink-3)',
        fontSize: 13,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'var(--sans)',
      }}
    >
      <IconBack size={13} />
      <span>Today</span>
    </button>
  );
}

function Prompt({ children = "What's on your mind?" }: { children?: string }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 38, marginBottom: 22 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'var(--accent)',
        }}
      >
        <IconSpark size={15} />
      </div>
      <div
        className="t-display"
        style={{
          fontSize: 38,
          color: 'var(--ink)',
          lineHeight: 1.05,
          marginTop: 6,
          fontStyle: 'italic',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CaptureComposer({
  value,
  onChange,
  onSubmit,
  onStartVoice,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStartVoice: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
}) {
  useEffect(() => {
    textareaRef.current?.focus();
  }, [textareaRef]);

  return (
    <>
      <Prompt />
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <div className="composer">
          <textarea
            ref={textareaRef}
            className={`input-text${value.length === 0 ? ' empty' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey && value.trim()) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Type, paste, drop, or hit voice…"
            rows={6}
            spellCheck={false}
          />
        </div>

        <div className="input-mode-row" style={{ justifyContent: 'center' }}>
          <button className="chip outline" style={{ height: 32 }} onClick={onStartVoice}>
            <IconMic size={13} />
            <span>Voice</span>
          </button>
          <button className="chip outline" style={{ height: 32 }}>
            <IconPaperclip size={13} />
            <span>Drop / paste a file</span>
          </button>
        </div>
      </div>
    </>
  );
}

function CaptureClassifying() {
  return (
    <>
      <Prompt />
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', textAlign: 'center' }}>
        <div className="composer" style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center' }}>
          <div className="thinking">
            <i /><i /><i />
            <span style={{ marginLeft: 6 }}>Classifying…</span>
          </div>
        </div>
      </div>
    </>
  );
}

function CaptureClassified({
  rawInput,
  result,
  onAddAnother,
  onBack,
  onChangeThis,
}: {
  rawInput: string;
  result: CaptureResult;
  onAddAnother: () => void;
  onBack: () => void;
  onChangeThis: () => void;
}) {
  const [selectedChip, setSelectedChip] = useState(TIME_SLOT_CHIP_INDEX[result.timeSlot] ?? 0);
  const bucketLabel = BUCKET_LABELS[result.bucket];
  const timeLabel = TIME_SLOT_LABELS[result.timeSlot];
  const latencyLabel =
    result.latencyMs >= 1000
      ? `${(result.latencyMs / 1000).toFixed(1)} s`
      : `${result.latencyMs} ms`;

  return (
    <>
      <Prompt />
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <div className="composer" style={{ minHeight: 0, padding: '14px 22px' }}>
          <div className="input-text recap">{rawInput}</div>
        </div>

        <div className="result-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ color: 'var(--accent)' }}>
              <IconSpark size={12} />
            </span>
            <span className="t-eyebrow" style={{ color: 'var(--urgent)' }}>
              {bucketLabel} · {timeLabel}
            </span>
            <span style={{ flex: 1 }} />
            <span className="t-mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
              {latencyLabel}
            </span>
          </div>

          <div
            style={{
              fontSize: 22,
              color: 'var(--ink)',
              fontWeight: 500,
              marginTop: 8,
              letterSpacing: '-0.015em',
            }}
          >
            {result.title}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 4 }}>{result.explanation}</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {TIME_CHIPS.map((chip, i) => (
              <button
                key={chip}
                className={`chip${i === selectedChip ? ' urgent' : ' outline'}`}
                onClick={() => setSelectedChip(i)}
              >
                {i === selectedChip && <IconCheck size={11} />}
                <span style={i === selectedChip ? { marginLeft: 2 } : undefined}>{chip}</span>
              </button>
            ))}
          </div>

          <div className="divider" style={{ margin: '18px 0 14px' }} />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="chip"
              style={{ height: 32, background: 'var(--upcoming-soft)', color: 'var(--upcoming)' }}
              onClick={onBack}
            >
              <IconThumbsUp size={13} />
              <span style={{ fontWeight: 500 }}>Looks right</span>
            </button>
            <button className="chip outline" style={{ height: 32 }} onClick={onChangeThis}>
              <IconThumbsDown size={13} />
              <span>Change this</span>
            </button>
            <span style={{ flex: 1 }} />
            <button className="chip outline" style={{ height: 32 }} onClick={onAddAnother}>
              <span style={{ display: 'inline-flex' }}>
                <IconPlus size={11} />
              </span>
              <span>Add another</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const WAVE_HEIGHTS = [30, 45, 70, 55, 40, 65, 80, 60, 35, 50, 75, 90, 70, 50, 30, 45, 60, 85, 70, 50,
  40, 65, 95, 75, 55, 35, 50, 80, 65, 45, 30, 55, 70, 60, 40, 50, 75, 55, 35, 25];

const VOICE_MOCK_TRANSCRIPT =
  'need to prep for the one on one with my manager on thursday';

function CaptureVoice({
  onStop,
  onCancel,
}: {
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div style={{ textAlign: 'center', marginTop: 38, marginBottom: 22 }}>
        <div style={{ color: 'var(--urgent)' }}>
          <IconMic size={20} />
        </div>
        <div
          className="t-display"
          style={{
            fontSize: 38,
            color: 'var(--ink)',
            lineHeight: 1.05,
            marginTop: 6,
            fontStyle: 'italic',
          }}
        >
          I'm listening…
        </div>
      </div>

      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <div className="composer" style={{ minHeight: 110, alignItems: 'center', justifyContent: 'center' }}>
          <div className="wave" style={{ width: '100%', justifyContent: 'center', gap: 5 }}>
            {WAVE_HEIGHTS.map((h, i) => (
              <i key={i} style={{ height: `${h}%`, animationDelay: `${(i % 8) * 0.07}s` }} />
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            textAlign: 'center',
            fontSize: 18,
            color: 'var(--ink-2)',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
          className="t-serif-i"
        >
          "{VOICE_MOCK_TRANSCRIPT}
          <span className="caret-bar" />"
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
          <button
            className="chip"
            style={{
              height: 36,
              padding: '0 16px',
              background: 'var(--ink)',
              color: 'var(--bg)',
              fontWeight: 500,
            }}
            onClick={onStop}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 1,
                background: 'var(--urgent)',
                display: 'inline-block',
              }}
            />
            <span>Stop & classify</span>
          </button>
          <button className="chip outline" style={{ height: 36, padding: '0 16px' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default function CaptureScreen({ onBack }: Props) {
  const [state, setState] = useState<CaptureState>('typing');
  const [inputValue, setInputValue] = useState('');
  const [classification, setClassification] = useState<{ task: Task; result: CaptureResult } | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { create, error } = useTasks();

  const footer: Record<CaptureState, string> = {
    typing: '⌘⏎ to confirm · ⎋ to dismiss',
    classifying: 'Saving your capture…',
    classified: 'thumbs up to save · ↩ or wait 3s to return',
    voice: 'tap to stop · auto-stops on silence',
  };

  const submitCapture = useCallback(
    async (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      setInputValue(trimmed);
      setState('classifying');
      try {
        const response = await create(trimmed);
        setClassification(response);
        setState('classified');
      } catch {
        setState('typing');
      }
    },
    [create],
  );

  const handleSubmit = useCallback(() => {
    void submitCapture(inputValue);
  }, [inputValue, submitCapture]);

  useEffect(() => {
    if (state !== 'typing') return;

    const focusComposer = () => {
      requestAnimationFrame(() => textareaRef.current?.focus());
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextEntryTarget(e.target, textareaRef.current)) return;

      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        if (inputValue.trim()) void submitCapture(inputValue);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape' || e.key === 'Tab' || e.key.startsWith('Arrow')) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        setInputValue((v) => v + '\n');
        focusComposer();
      } else if (e.key.length === 1) {
        e.preventDefault();
        setInputValue((v) => v + e.key);
        focusComposer();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setInputValue((v) => v.slice(0, -1));
        focusComposer();
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      if (isTextEntryTarget(e.target, textareaRef.current)) return;
      const text = e.clipboardData?.getData('text');
      if (!text) return;
      e.preventDefault();
      setInputValue((v) => v + text);
      focusComposer();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [state, inputValue, submitCapture]);

  const handleAddAnother = () => {
    setInputValue('');
    setClassification(null);
    setState('typing');
  };

  const handleChangeThis = () => {
    setClassification(null);
    setState('typing');
  };

  const handleVoiceStop = () => {
    void submitCapture(VOICE_MOCK_TRANSCRIPT);
  };

  return (
    <FxWindow title="Capture">
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 56px 32px',
          minHeight: 0,
          position: 'relative',
        }}
      >
        <BackNav onBack={onBack} />

        {state === 'typing' && (
          <CaptureComposer
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStartVoice={() => setState('voice')}
            textareaRef={textareaRef}
          />
        )}
        {state === 'classifying' && <CaptureClassifying />}
        {state === 'classified' && classification && (
          <CaptureClassified
            rawInput={inputValue}
            result={classification.result}
            onAddAnother={handleAddAnother}
            onBack={onBack}
            onChangeThis={handleChangeThis}
          />
        )}
        {state === 'voice' && (
          <CaptureVoice onStop={handleVoiceStop} onCancel={() => setState('typing')} />
        )}

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            color: 'var(--ink-3)',
            fontSize: 12,
            paddingTop: 16,
          }}
        >
          <span className="t-mono" style={{ fontSize: 11 }}>
            {footer[state]}
          </span>
          {error && (
            <span style={{ fontSize: 11, color: 'var(--urgent)' }}>{error}</span>
          )}
        </div>
      </div>
    </FxWindow>
  );
}
