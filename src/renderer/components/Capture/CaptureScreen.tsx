import { useState, useRef, useEffect, useCallback } from 'react';
import FxWindow from '../Window/FxWindow';
import type {
  ClassificationBucket,
  ClassificationResult,
  ClassifyResponse,
  ParsedPlanningItem,
} from '@needle/domain/types';
import { AsyncStatusPanel, Button, Divider, Icon, Pill } from '../primitives';
import ApiKeySettings from './ApiKeySettings';
import { usePendingOperation } from '../../hooks/usePendingOperation';
import { useAppStore } from '../../state/store';
import { addDaysISO, toISODate } from '../../utils/date';
import { uiLog } from '../../utils/ui-log';
import './CaptureScreen.css';

const CLASSIFY_TIMEOUT_MS = 30_000;

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

type DraftPlanningItem = ParsedPlanningItem & {
  localId: string;
};

type DraftPlanningPatch = Partial<Omit<DraftPlanningItem, 'suggestedDate' | 'suggestedTime'>> & {
  suggestedDate?: string | undefined;
  suggestedTime?: string | undefined;
};

function normalizePlanningItems(result: ClassificationResult): DraftPlanningItem[] {
  const items = result.items ?? [
    {
      id: 'parsed-1',
      itemType: 'task' as const,
      scheduleMode: result.suggestedTime === undefined ? 'flexible' as const : 'fixed' as const,
      title: result.title,
      bucket: result.bucket,
      ...(result.suggestedDate !== undefined ? { suggestedDate: result.suggestedDate } : {}),
      ...(result.suggestedTime !== undefined ? { suggestedTime: result.suggestedTime } : {}),
      reasoning: result.reasoning,
      confidence: result.confidence,
    },
  ];

  return items.map((item, index) => ({
    ...item,
    localId: `${item.id}-${index}`,
  }));
}

function dateForBucket(bucket: ClassificationBucket): string | null {
  const today = toISODate();
  if (bucket === 'today') return today;
  if (bucket === 'tomorrow') return addDaysISO(today, 1);
  if (bucket === 'later') return addDaysISO(today, 3);
  return null;
}

function isDraftReady(item: DraftPlanningItem): boolean {
  if (item.title.trim().length === 0) return false;
  if (item.itemType === 'event') return item.suggestedTime?.trim().length === 5;
  if (item.scheduleMode === 'fixed') return item.suggestedTime?.trim().length === 5;
  return true;
}

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

function CaptureEmpty({
  onStartTyping,
}: {
  onStartTyping: (v: string) => void;
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
      </div>
    </div>
  );
}

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
      </div>
    </div>
  );
}

function CaptureClassifying({
  rawInput,
  elapsedMs,
  isSlow,
  onCancel,
}: {
  rawInput: string;
  elapsedMs: number;
  isSlow: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="capture-panel-enter">
      <Prompt>Reading your capture…</Prompt>
      <div className="capture-content">
        <div className="composer capture-composer--compact">
          <div className="input-text capture-composer__recap">{rawInput}</div>
        </div>
        <div className="composer capture-composer--compact capture-classifying">
          <AsyncStatusPanel
            label="classifying"
            detail="Matching to your calendar and today's plan…"
            elapsedMs={elapsedMs}
            isSlow={isSlow}
            slowMessage="Still working — or cancel and save without AI."
            onCancel={onCancel}
            cancelLabel="Cancel"
          />
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
  onConfirm,
  onBack,
}: {
  rawInput: string;
  result: ClassificationResult;
  latencyMs: number;
  onAddAnother: () => void;
  onConfirm: (items: DraftPlanningItem[]) => void;
  onBack: () => void;
}) {
  const [draftItems, setDraftItems] = useState<DraftPlanningItem[]>(() =>
    normalizePlanningItems(result),
  );

  useEffect(() => {
    setDraftItems(normalizePlanningItems(result));
  }, [result]);

  const updateDraft = (localId: string, patch: DraftPlanningPatch) => {
    setDraftItems((items) =>
      items.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, ...patch };
        if (Object.prototype.hasOwnProperty.call(patch, 'suggestedDate') && patch.suggestedDate === undefined) {
          delete next.suggestedDate;
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'suggestedTime') && patch.suggestedTime === undefined) {
          delete next.suggestedTime;
        }
        return next as DraftPlanningItem;
      }),
    );
  };

  const removeDraft = (localId: string) => {
    setDraftItems((items) => items.filter((item) => item.localId !== localId));
  };

  const splitDraft = (item: DraftPlanningItem) => {
    const parts = item.title
      .split(/\s+(?:and|then)\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return;
    const replacements = parts.map((title, index) => ({
      ...item,
      id: `${item.id}-split-${index + 1}`,
      localId: `${item.localId}-split-${index + 1}`,
      title,
    }));
    setDraftItems((items) =>
      items.flatMap((current) => (current.localId === item.localId ? replacements : [current])),
    );
  };

  const mergeWithNext = (index: number) => {
    setDraftItems((items) => {
      const next = items[index + 1];
      const current = items[index];
      if (current === undefined || next === undefined) return items;
      return items.flatMap((item, i) => {
        if (i === index) {
          return [{ ...current, title: `${current.title}; ${next.title}` }];
        }
        if (i === index + 1) return [];
        return [item];
      });
    });
  };

  const canSplitDraft = (item: DraftPlanningItem) =>
    item.title
      .split(/\s+(?:and|then)\s+/i)
      .map((part) => part.trim())
      .filter(Boolean).length > 1;

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

          <div className="capture-generated-list" aria-label="Generated planning items">
            {draftItems.map((item, index) => (
              <div className="capture-generated-item" key={item.localId}>
                <div className="capture-generated-item__main">
                  <input
                    className="capture-generated-item__title"
                    value={item.title}
                    onChange={(e) => updateDraft(item.localId, { title: e.target.value })}
                    aria-label={`Generated item ${index + 1} title`}
                  />
                  <div className="capture-generated-item__reason">{item.reasoning}</div>
                </div>

                <div className="capture-generated-item__controls">
                  <select
                    value={item.itemType}
                    onChange={(e) =>
                      updateDraft(item.localId, {
                        itemType: e.target.value as DraftPlanningItem['itemType'],
                        scheduleMode: e.target.value === 'event' ? 'fixed' : item.scheduleMode,
                      })
                    }
                    aria-label={`Generated item ${index + 1} type`}
                  >
                    <option value="task">Task</option>
                    <option value="event">Event</option>
                  </select>
                  <select
                    value={item.bucket}
                    onChange={(e) =>
                      updateDraft(item.localId, {
                        bucket: e.target.value as DraftPlanningItem['bucket'],
                        suggestedDate: dateForBucket(e.target.value as ClassificationBucket) ?? undefined,
                      })
                    }
                    aria-label={`Generated item ${index + 1} day`}
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="later">Later</option>
                    <option value="someday">Someday</option>
                  </select>
                  <select
                    value={item.scheduleMode}
                    onChange={(e) =>
                      updateDraft(item.localId, {
                        scheduleMode: e.target.value as DraftPlanningItem['scheduleMode'],
                      })
                    }
                    aria-label={`Generated item ${index + 1} schedule mode`}
                  >
                    <option value="flexible">Flexible</option>
                    <option value="fixed">Fixed time</option>
                  </select>
                  <input
                    className="capture-generated-item__time"
                    type="time"
                    value={item.suggestedTime ?? ''}
                    disabled={item.scheduleMode === 'flexible'}
                    onChange={(e) =>
                      updateDraft(item.localId, {
                        suggestedTime: e.target.value === '' ? undefined : e.target.value,
                      })
                    }
                    aria-label={`Generated item ${index + 1} time`}
                  />
                </div>

                <div className="capture-generated-item__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canSplitDraft(item)}
                    onClick={() => splitDraft(item)}
                  >
                    Split
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === draftItems.length - 1}
                    onClick={() => mergeWithNext(index)}
                  >
                    Merge
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={draftItems.length === 1}
                    onClick={() => removeDraft(item.localId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
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
              disabled={!draftItems.some(isDraftReady)}
              onClick={() => onConfirm(draftItems)}
            >
              Confirm blocks
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={<Icon name="thumbs-down" size={13} tone="muted" />}
              onClick={onBack}
            >
              Cancel
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
  const createPlanningItems = useAppStore((s) => s.createPlanningItems);
  const classifyOp = usePendingOperation<ClassifyResponse>();

  const footer: Record<CaptureState, string> = {
    empty: '⌘ K captures from anywhere on your Mac',
    typing: '⏎ to confirm · ⎋ to dismiss',
    classifying: 'classifying with Claude…',
    classified: 'review each block, then confirm or cancel',
    'classify-error': 'fix the issue or save without classification',
    voice: 'tap to stop · auto-stops on silence',
  };

  const handleClassifyCancel = useCallback(() => {
    classifyOp.cancel();
    uiLog('capture', 'classify cancelled by user');
    setState('typing');
  }, [classifyOp]);

  const runClassify = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!window.api?.ai) {
        uiLog('capture', 'classify aborted — window.api.ai missing');
        setClassifyError('App bridge not ready — restart the app');
        setState('classify-error');
        return;
      }

      setClassifyError(null);
      setClassification(null);
      setState('classifying');
      uiLog('capture', 'classify start', { textLen: trimmed.length });

      const started = performance.now();
      const result = await classifyOp.run(
        () => window.api.ai.classify(trimmed),
        { timeoutMs: CLASSIFY_TIMEOUT_MS },
      );
      const elapsed = performance.now() - started;
      setLatencyMs(elapsed);

      if (result.outcome === 'cancelled') {
        uiLog('capture', 'classify abandoned after cancel');
        return;
      }

      if (result.outcome === 'error') {
        uiLog('capture', 'classify failed', { error: result.message, ms: Math.round(elapsed) });
        setClassifyError(result.message);
        setState('classify-error');
        return;
      }

      const response: ClassifyResponse = result.value;
      if ('error' in response) {
        uiLog('capture', 'classify error', { error: response.error, ms: Math.round(elapsed) });
        setClassifyError(response.error);
        setState('classify-error');
        return;
      }

      uiLog('capture', 'classify ok', { bucket: response.bucket, ms: Math.round(elapsed) });
      setClassification(response);
      setState('classified');
      if (window.api.db) {
        void window.api.db.addCapture(trimmed).catch((err: unknown) => {
          uiLog('capture', 'db:addCapture failed', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    },
    [classifyOp],
  );

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

  const handleConfirmDrafts = (items: DraftPlanningItem[]) => {
    const validItems = items.filter(isDraftReady);
    uiLog('capture', 'confirm parsed items', { count: validItems.length });

    const parsedItems: ParsedPlanningItem[] = validItems.map(({ localId: _localId, ...item }) => item);
    void createPlanningItems({
      rawInput: inputValue.trim(),
      items: parsedItems,
    }).then(() => {
      onBack();
    });
  };

  return (
    <FxWindow title="Capture">
      <div className="capture-shell">
        <BackNav onBack={onBack} />

        {state === 'empty' && (
          <CaptureEmpty onStartTyping={handleStartTyping} />
        )}
        {state === 'typing' && (
          <CaptureTyping
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        )}
        {state === 'classifying' && (
          <CaptureClassifying
            rawInput={inputValue}
            elapsedMs={classifyOp.elapsedMs}
            isSlow={classifyOp.isSlow}
            onCancel={handleClassifyCancel}
          />
        )}
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
            onConfirm={handleConfirmDrafts}
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
