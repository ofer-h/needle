import { useEffect, useState } from 'react';
import './ApiKeySettings.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ApiKeySettings({ open, onClose }: Props) {
  const [value, setValue] = useState('');
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !window.api) return;
    void window.api.ai.hasApiKey().then(setConfigured);
    setValue('');
    setStatus(null);
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!window.api) return;
    setSaving(true);
    setStatus(null);
    const result = await window.api.ai.setApiKey(value);
    setSaving(false);
    if ('error' in result) {
      setStatus(result.error);
      return;
    }
    setConfigured(true);
    setValue('');
    setStatus('Saved. Key is stored locally in userData/config.json.');
  };

  return (
    <div className="api-key-overlay" role="dialog" aria-modal="true" aria-labelledby="api-key-title">
      <button type="button" className="api-key-overlay__backdrop" aria-label="Close" onClick={onClose} />
      <div className="api-key-panel">
        <h2 id="api-key-title" className="api-key-panel__title">
          Anthropic API key
        </h2>
        <p className="api-key-panel__hint">
          Required for capture classification. Set <code>ANTHROPIC_API_KEY</code> in the environment or paste a
          key here (saved to app user data, never logged).
        </p>
        {configured && (
          <p className="api-key-panel__status api-key-panel__status--ok">A key is configured.</p>
        )}
        <label className="api-key-panel__label" htmlFor="api-key-input">
          API key
        </label>
        <input
          id="api-key-input"
          type="password"
          className="api-key-panel__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
        />
        {status !== null && (
          <p className="api-key-panel__status">{status}</p>
        )}
        <div className="api-key-panel__actions">
          <button type="button" className="chip outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="chip"
            disabled={saving || !value.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save key'}
          </button>
        </div>
      </div>
    </div>
  );
}
