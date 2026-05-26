import { useEffect, useRef, useState } from 'react';
import type { CaptureEntry, Intervention } from '../../../shared/domain-v2';
import { useV2Store } from '../../state/store-v2';
import { nowIso } from '../../utils/dev-clock';
import { Button } from '../primitives/Button';
import './ModalCapture.css';

type Props = {
  intervention: Intervention;
  entries: CaptureEntry[];
  onClose: () => void;
};

export default function ModalCapture({ intervention, entries, onClose }: Props) {
  const addCaptureEntry = useV2Store((s) => s.addCaptureEntry);
  const promoteCaptureEntry = useV2Store((s) => s.promoteCaptureEntry);
  const dismissCaptureEntry = useV2Store((s) => s.dismissCaptureEntry);
  const resolveIntervention = useV2Store((s) => s.resolveIntervention);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const title = typeof intervention.payload.title === 'string' ? intervention.payload.title : 'Brain-dump';
  const subtitle =
    typeof intervention.payload.subtitle === 'string'
      ? intervention.payload.subtitle
      : 'Anything on your mind before the next thing?';

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    addCaptureEntry({
      body: trimmed,
      ...(intervention.flowSessionId !== undefined ? { flowSessionId: intervention.flowSessionId } : {}),
    });
    setDraft('');
    textareaRef.current?.focus();
  }

  function handleClose() {
    const captured = entries.length > 0;
    resolveIntervention(intervention.id, captured ? 'completed' : 'dismissed', nowIso());
    onClose();
  }

  return (
    <div className="modal-capture" role="dialog" aria-modal="true" aria-labelledby="modal-capture-title">
      <div className="modal-capture__scrim" />
      <div className="modal-capture__card">
        <div className="modal-capture__header">
          <h2 id="modal-capture-title" className="modal-capture__title">
            {title}
          </h2>
          <p className="modal-capture__subtitle">{subtitle}</p>
        </div>

        <textarea
          ref={textareaRef}
          className="modal-capture__input"
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

        <div className="modal-capture__draft-actions">
          <Button size="sm" variant="ghost" onClick={() => setDraft('')} disabled={draft.length === 0}>
            Clear
          </Button>
          <Button size="sm" onClick={commitDraft} disabled={draft.trim().length === 0}>
            Add
          </Button>
        </div>

        {entries.length > 0 && (
          <ul className="modal-capture__entries" aria-label="Captured thoughts">
            {entries.map((entry) => (
              <li key={entry.id} className="modal-capture__entry">
                <span className="modal-capture__entry-body">{entry.body}</span>
                <span className="modal-capture__entry-actions">
                  <Button size="sm" variant="ghost" onClick={() => promoteCaptureEntry(entry.id)}>
                    Promote to task
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismissCaptureEntry(entry.id)}>
                    Dismiss
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-capture__footer">
          <Button size="md" variant="ghost" onClick={handleClose}>
            {entries.length > 0 ? 'Done, ready to focus' : 'Skip capture'}
          </Button>
        </div>
      </div>
    </div>
  );
}
