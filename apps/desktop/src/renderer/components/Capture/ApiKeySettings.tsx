import { useEffect, useState } from 'react';
import { usePendingOperation } from '../../hooks/usePendingOperation';
import { uiLog } from '../../utils/ui-log';
import './ApiKeySettings.css';

const SAVE_KEY_TIMEOUT_MS = 10_000;

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ApiKeySettings({ open, onClose }: Props) {
  const [value, setValue] = useState('');
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const saveOp = usePendingOperation<{ ok: true } | { error: string }>();
  const saving = saveOp.status === 'pending';

  useEffect(() => {
    if (!open) return;
    setValue('');
    setStatus(null);
    if (!window.api?.ai) {
      setConfigured(false);
      setStatus('App bridge not ready — restart the app');
      return;
    }
    void window.api.ai.hasApiKey().then((ok) => {
      setConfigured(ok);
      uiLog('api-key', 'hasApiKey', { configured: ok });
    });
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!window.api?.ai) {
      setStatus('App bridge not ready — restart the app');
      return;
    }
    setStatus(null);
    uiLog('api-key', 'save start');

    const run = await saveOp.run(
      () => window.api.ai.setApiKey(value),
      { timeoutMs: SAVE_KEY_TIMEOUT_MS },
    );

    if (run.outcome === 'cancelled') return;

    if (run.outcome === 'error') {
      uiLog('api-key', 'save failed', { error: run.message });
      setStatus(run.message);
      return;
    }

    const result = run.value;
    if ('error' in result) {
      uiLog('api-key', 'save failed', { error: result.error });
      setStatus(result.error);
      return;
    }

    setConfigured(true);
    setValue('');
    setStatus('Saved. Key is stored locally in userData/config.json.');
    uiLog('api-key', 'save ok');
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
            {saving
              ? saveOp.isSlow
                ? `Still saving… (${(saveOp.elapsedMs / 1000).toFixed(0)}s)`
                : 'Saving…'
              : 'Save key'}
          </button>
        </div>
      </div>
    </div>
  );
}
