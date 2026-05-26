import { useEffect, useRef, useState } from 'react';
import type { CaptureShowPayload } from '../../../shared/ipc-contracts';
import { Button } from '../primitives/Button';
import './CaptureWindow.css';

type LocalEntry = {
  id: string;
  body: string;
  status: 'raw' | 'promoted' | 'dismissed';
};

const FALLBACK: CaptureShowPayload = {
  correlationId: 'unknown',
  title: 'Brain-dump',
  subtitle: 'Anything on your mind before the next thing?',
};

let entryCounter = 0;
function mintEntryId(): string {
  entryCounter += 1;
  return `cap_${Date.now().toString(36)}_${entryCounter.toString(36)}`;
}

export default function CaptureWindow() {
  const [payload, setPayload] = useState<CaptureShowPayload>(FALLBACK);
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.capture.onPayload((next) => setPayload(next));
    return unsub;
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    const entry: LocalEntry = { id: mintEntryId(), body: trimmed, status: 'raw' };
    setEntries((prev) => [...prev, entry]);
    setDraft('');
    textareaRef.current?.focus();
    window.api?.capture.addEntry({
      correlationId: payload.correlationId,
      entryId: entry.id,
      body: entry.body,
    });
  }

  function promote(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'promoted' } : e)));
    window.api?.capture.promoteEntry({ correlationId: payload.correlationId, entryId: id });
  }

  function dismiss(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'dismissed' } : e)));
    window.api?.capture.dismissEntry({ correlationId: payload.correlationId, entryId: id });
  }

  function close() {
    const captured = entries.some((e) => e.status !== 'dismissed');
    window.api?.capture.close({
      correlationId: payload.correlationId,
      reason: captured ? 'completed' : 'dismissed',
    });
  }

  return (
    <div className="capture-window" role="dialog" aria-modal="true" aria-labelledby="capture-title">
      <div className="capture-window__header">
        <h2 id="capture-title" className="capture-window__title">
          {payload.title}
        </h2>
        <p className="capture-window__subtitle">{payload.subtitle}</p>
      </div>

      <textarea
        ref={textareaRef}
        className="capture-window__input"
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            commitDraft();
          }
        }}
        placeholder="One thought per line. Cmd/Ctrl+Enter to add."
        rows={3}
      />

      <div className="capture-window__draft-actions">
        <Button size="sm" variant="ghost" onClick={() => setDraft('')} disabled={draft.length === 0}>
          Clear
        </Button>
        <Button size="sm" onClick={commitDraft} disabled={draft.trim().length === 0}>
          Add
        </Button>
      </div>

      {entries.length > 0 && (
        <ul className="capture-window__entries" aria-label="Captured thoughts">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`capture-window__entry capture-window__entry--${entry.status}`}
            >
              <span className="capture-window__entry-body">{entry.body}</span>
              {entry.status === 'raw' && (
                <span className="capture-window__entry-actions">
                  <Button size="sm" variant="ghost" onClick={() => promote(entry.id)}>
                    Promote
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismiss(entry.id)}>
                    Dismiss
                  </Button>
                </span>
              )}
              {entry.status === 'promoted' && (
                <span className="capture-window__entry-tag">→ task</span>
              )}
              {entry.status === 'dismissed' && (
                <span className="capture-window__entry-tag">dismissed</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="capture-window__footer">
        <Button size="md" variant="ghost" onClick={close}>
          {entries.some((e) => e.status !== 'dismissed') ? 'Done, ready to focus' : 'Skip capture'}
        </Button>
      </div>
    </div>
  );
}
