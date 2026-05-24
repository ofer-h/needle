import { useState, useRef, useEffect } from 'react';
import FxWindow from '../Window/FxWindow';
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

type CaptureState = 'empty' | 'typing' | 'classified' | 'voice';

type Props = {
  onBack: () => void;
};

const TIME_CHIPS = ['Today', 'Tomorrow', 'In a few days', 'Next Sun', 'Next week', 'Someday', 'Pick date…'];

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

function ModeButtons() {
  return (
    <div className="input-mode-row" style={{ justifyContent: 'center' }}>
      <button className="chip outline" style={{ height: 32 }}>
        <IconMic size={13} />
        <span>Voice</span>
      </button>
      <button className="chip outline" style={{ height: 32 }}>
        <IconPaperclip size={13} />
        <span>Drop / paste a file</span>
      </button>
    </div>
  );
}

// ── State 1: Empty ───────────────────────────────────────────────
function CaptureEmpty({ onStartTyping, onStartVoice }: { onStartTyping: (v: string) => void; onStartVoice: () => void }) {
  return (
    <>
      <Prompt />
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <div className="composer">
          <div
            className="input-text empty"
            style={{ cursor: 'text' }}
            onClick={() => onStartTyping('')}
          >
            Type, paste, drop, or hit voice…<span className="caret-bar" />
          </div>
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

// ── State 2: Typing ──────────────────────────────────────────────
function CaptureTyping({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const showPreview = value.length > 8;

  return (
    <>
      <Prompt />
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <div className="composer">
          <textarea
            ref={textareaRef}
            className="input-text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder=""
            rows={6}
          />
        </div>

        <ModeButtons />

        {showPreview && (
          <div
            style={{
              marginTop: 22,
              paddingLeft: 14,
              borderLeft: '2px solid var(--urgent)',
            }}
          >
            <div className="thinking" style={{ marginBottom: 6 }}>
              <i /><i /><i />
              <span style={{ marginLeft: 6 }}>reading</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
              Looks like an <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Act</strong>{' '}
              item — I can link it to your Thursday 3 PM meeting and put it on today.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── State 3: Classified ──────────────────────────────────────────
function CaptureClassified({
  rawInput,
  onAddAnother,
  onBack,
}: {
  rawInput: string;
  onAddAnother: () => void;
  onBack: () => void;
}) {
  const [selectedChip, setSelectedChip] = useState(0);

  return (
    <>
      <Prompt />
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        {/* Compact input recap */}
        <div className="composer" style={{ minHeight: 0, padding: '14px 22px' }}>
          <div className="input-text recap">
            {rawInput || 'prep for the 1on1 with my manager on thursday'}
          </div>
        </div>

        {/* Result card */}
        <div className="result-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ color: 'var(--accent)' }}>
              <IconSpark size={12} />
            </span>
            <span className="t-eyebrow" style={{ color: 'var(--urgent)' }}>
              Act · Today
            </span>
            <span style={{ flex: 1 }} />
            <span className="t-mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
              1.2 s
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
            Prep for manager 1:1
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 4 }}>
            Linked to your Thursday 3 PM meeting · 2 hr lead
          </div>

          {/* Time chips */}
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

          {/* Feedback */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="chip"
              style={{ height: 32, background: 'var(--upcoming-soft)', color: 'var(--upcoming)' }}
              onClick={onBack}
            >
              <IconThumbsUp size={13} />
              <span style={{ fontWeight: 500 }}>Looks right</span>
            </button>
            <button className="chip outline" style={{ height: 32 }}>
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

// ── State 4: Voice ───────────────────────────────────────────────
const WAVE_HEIGHTS = [30, 45, 70, 55, 40, 65, 80, 60, 35, 50, 75, 90, 70, 50, 30, 45, 60, 85, 70, 50,
  40, 65, 95, 75, 55, 35, 50, 80, 65, 45, 30, 55, 70, 60, 40, 50, 75, 55, 35, 25];

function CaptureVoice({ onStop, onCancel }: { onStop: () => void; onCancel: () => void }) {
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
              <i
                key={i}
                style={{ height: `${h}%`, animationDelay: `${(i % 8) * 0.07}s` }}
              />
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
          "need to prep for the one on one with my manager on thursday
          <span className="caret-bar" />"
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
          <button
            className="chip"
            style={{ height: 36, padding: '0 16px', background: 'var(--ink)', color: 'var(--bg)', fontWeight: 500 }}
            onClick={onStop}
          >
            <span style={{ width: 8, height: 8, borderRadius: 1, background: 'var(--urgent)', display: 'inline-block' }} />
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

// ── Main CaptureScreen ───────────────────────────────────────────
export default function CaptureScreen({ onBack }: Props) {
  const [state, setState] = useState<CaptureState>('empty');
  const [inputValue, setInputValue] = useState('');

  const footer: Record<CaptureState, string> = {
    empty: '⌘ K captures from anywhere on your Mac',
    typing: '⏎ to confirm · ⎋ to dismiss',
    classified: 'thumbs up to save · ↩ or wait 3s to return',
    voice: 'tap to stop · auto-stops on silence',
  };

  const handleStartTyping = (v: string) => {
    setInputValue(v);
    setState('typing');
  };

  const handleSubmit = () => {
    if (inputValue.trim()) setState('classified');
  };

  const handleAddAnother = () => {
    setInputValue('');
    setState('empty');
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
          />
        )}
        {state === 'classified' && (
          <CaptureClassified
            rawInput={inputValue}
            onAddAnother={handleAddAnother}
            onBack={onBack}
          />
        )}
        {state === 'voice' && (
          <CaptureVoice
            onStop={() => setState('classified')}
            onCancel={() => setState('empty')}
          />
        )}

        {/* Footer hint */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--ink-3)',
            fontSize: 12,
            paddingTop: 16,
          }}
        >
          <span className="t-mono" style={{ fontSize: 11 }}>
            {footer[state]}
          </span>
        </div>
      </div>
    </FxWindow>
  );
}
