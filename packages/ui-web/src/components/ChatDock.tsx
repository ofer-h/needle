import { useState, type KeyboardEvent } from 'react';
import { assistantMessage, userMessage, type ChatMessage } from '../model';
import { Icon } from '../primitives';
import './ChatDock.css';

type ChatDockProps = {
  /** Apply a user message to the board. Returns the assistant's reply and, if
   * the turn changed data, the id of the revertible revision it created. */
  onSend: (text: string) => { reply: string; revisionId?: string };
  /** Revert the change a given assistant turn made. */
  onUndo: (revisionId: string) => void;
};

const GREETING: ChatMessage = assistantMessage(
  'Hey. Tell me what to add, remember, or change — “add standup 10am”, “remember to call the dentist”, “set ticket id to abc-42”. Everything I do, you can undo.',
);

/** Write-to-the-AI dock. Scripted replies mutate the board and create a
 * revertible revision; assistant turns that changed data show "↩ undo". */
export function ChatDock({ onSend, onUndo }: ChatDockProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [text, setText] = useState('');
  const [undone, setUndone] = useState<Set<string>>(new Set());

  const send = () => {
    const raw = text.trim();
    if (!raw) return;
    const { reply, revisionId } = onSend(raw);
    setMessages((prev) => [...prev, userMessage(raw), assistantMessage(reply, revisionId)]);
    setText('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  const handleUndo = (revisionId: string) => {
    onUndo(revisionId);
    setUndone((prev) => new Set(prev).add(revisionId));
  };

  return (
    <div className="chatdock">
      <div className="chatdock__log" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`chatdock__msg chatdock__msg--${m.role}`}>
            <div className="chatdock__bubble">{m.text}</div>
            {m.role === 'assistant' && m.revisionId && (
              <button
                type="button"
                className="chatdock__undo"
                onClick={() => handleUndo(m.revisionId!)}
                disabled={undone.has(m.revisionId)}
              >
                <Icon name="undo" size={12} tone="muted" />
                {undone.has(m.revisionId) ? 'reverted' : 'undo'}
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="chatdock__compose">
        <input
          className="chatdock__input"
          value={text}
          placeholder="Tell the AI…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          aria-label="Message the AI"
        />
        <button
          type="button"
          className="chatdock__send"
          onClick={send}
          disabled={!text.trim()}
          aria-label="Send"
        >
          <Icon name="arrow" size={16} tone="inherit" />
        </button>
      </div>
    </div>
  );
}
