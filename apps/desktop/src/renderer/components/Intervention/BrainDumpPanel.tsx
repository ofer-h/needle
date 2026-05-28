import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import './BrainDumpPanel.css';

export type BrainDumpPanelProps = {
  correlationId: string;
  title: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

export default function BrainDumpPanel({
  correlationId,
  title,
  onSubmit,
  onCancel,
}: BrainDumpPanelProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus when panel appears
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSubmit() {
    onSubmit(text.trim());
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    // Cmd+Enter or Ctrl+Enter submits
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  void correlationId;

  return (
    <div className="brain-dump" role="dialog" aria-modal="true" aria-label="Brain dump">
      <div className="brain-dump__card">
        <header className="brain-dump__header">
          <h2 className="brain-dump__title">Brain dump</h2>
          <p className="brain-dump__subtitle">
            Clear your head before switching to <span className="brain-dump__event">{title}</span>
          </p>
        </header>

        <textarea
          ref={textareaRef}
          className="brain-dump__textarea"
          placeholder="Tasks, worries, random thoughts — anything that's in your head right now…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          spellCheck
          autoComplete="off"
        />

        <footer className="brain-dump__footer">
          <span className="brain-dump__hint">⌘↵ to save</span>
          <div className="brain-dump__actions">
            <button
              type="button"
              className="brain-dump__btn brain-dump__btn--cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="brain-dump__btn brain-dump__btn--done"
              onClick={handleSubmit}
            >
              {text.trim().length > 0 ? 'Save & continue' : 'Continue'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
