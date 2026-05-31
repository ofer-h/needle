import { useState } from 'react';
import type { SystemBlock, TransitionSession } from '../model/transition';
import { systemBlockKindLabel } from '../model/transition';
import { Button, Icon } from '../primitives';
import { BreathHearth } from './BreathHearth';
import './TransitionOverlay.css';

export type TransitionOverlayProps = {
  session: TransitionSession;
  /** seconds remaining in the active block, controlled by the caller's clock */
  secondsLeftInBlock: number;
  onBlockDone: (blockId: string) => void;
  onDecline: (blockId: string) => void;
  onPostpone?: (blockId: string) => void;
  onDumpCapture?: (text: string) => void;
  onFinish: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatAnchorTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

type BlockPanelProps = {
  block: SystemBlock;
  dumpText: string;
  onDumpChange: (text: string) => void;
  planText: string;
  onPlanChange: (text: string) => void;
};

function BlockPanel({ block, dumpText, onDumpChange, planText, onPlanChange }: BlockPanelProps) {
  switch (block.kind) {
    case 'brain_dump':
      return (
        <textarea
          className="to__textarea"
          value={dumpText}
          onChange={(e) => onDumpChange(e.target.value)}
          placeholder="Empty your head…"
          aria-label={block.label}
          rows={5}
        />
      );

    case 'break':
      return (
        <>
          <p className="to__break-note">Stand up, breathe, look away from the screen.</p>
          <div className="transition__breath-slot">
            <BreathHearth label="Breathe" size={140} />
          </div>
        </>
      );

    case 'plan_next':
    case 'prep':
      return (
        <textarea
          className="to__textarea"
          value={planText}
          onChange={(e) => onPlanChange(e.target.value)}
          placeholder={block.kind === 'plan_next' ? 'Pick the one next move…' : 'What do you need to be ready…'}
          aria-label={block.label}
          rows={3}
        />
      );

    case 'leave_by':
      return <p className="to__leave-note">Time to head out — step away from the screen.</p>;
  }
}

export function TransitionOverlay({
  session,
  secondsLeftInBlock,
  onBlockDone,
  onDecline,
  onPostpone,
  onDumpCapture,
  onFinish,
}: TransitionOverlayProps) {
  const [dumpText, setDumpText] = useState('');
  const [planText, setPlanText] = useState('');

  const { blocks, activeIndex, anchorTitle, anchorStartsAt } = session;

  // Guard: no active block (between-block state or session not yet started)
  const activeBlock: SystemBlock | undefined = activeIndex >= 0 ? blocks[activeIndex] : undefined;

  const nonDeclinedBlocks = blocks.filter((b) => !b.declined);
  const totalSteps = nonDeclinedBlocks.length;
  const doneCount = activeIndex >= 0 ? activeIndex : 0;

  const isLastActiveBlock =
    activeIndex >= 0 &&
    blocks.slice(activeIndex + 1).every((b) => b.declined);

  const isCountdownLow = secondsLeftInBlock > 0 && secondsLeftInBlock <= 30;
  const isCountdownExpired = secondsLeftInBlock === 0;

  function handleBlockDone() {
    if (!activeBlock) return;
    if (activeBlock.kind === 'brain_dump' && dumpText.trim()) {
      onDumpCapture?.(dumpText.trim());
    }
    if (isLastActiveBlock) {
      onFinish();
    } else {
      onBlockDone(activeBlock.id);
    }
  }

  function handleDecline() {
    if (!activeBlock) return;
    onDecline(activeBlock.id);
  }

  function handlePostpone() {
    if (!activeBlock) return;
    onPostpone?.(activeBlock.id);
  }

  return (
    <div className="to" role="region" aria-label="Transition overlay">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="to__header">
        <div className="to__anchor-row">
          <Icon name="calendar" size={14} tone="upcoming" />
          <span className="to__anchor-title">{anchorTitle}</span>
          <span className="to__anchor-time">starting at {formatAnchorTime(anchorStartsAt)}</span>
        </div>
        <p className="to__meta">
          {totalSteps === 1
            ? '1 step before you go'
            : `${totalSteps} steps before you go`}
        </p>
      </header>

      {/* ── Progress rail ──────────────────────────────────────────────── */}
      <nav className="to__rail" aria-label="Transition steps">
        <ol className="to__rail-list">
          {blocks.map((block, i) => {
            let stepState: 'done' | 'active' | 'pending' | 'declined';
            if (block.declined) {
              stepState = 'declined';
            } else if (i < activeIndex) {
              stepState = 'done';
            } else if (i === activeIndex) {
              stepState = 'active';
            } else {
              stepState = 'pending';
            }

            return (
              <li key={block.id} className={`to__step to__step--${stepState}`} aria-current={stepState === 'active' ? 'step' : undefined}>
                <span className="to__step-icon" aria-hidden="true">
                  {stepState === 'done' && <Icon name="check" size={10} tone="upcoming" />}
                  {stepState === 'active' && <Icon name="arrow" size={10} tone="inherit" />}
                </span>
                <span className="to__step-label">{systemBlockKindLabel(block.kind)}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ── Between-blocks state ───────────────────────────────────────── */}
      {!activeBlock && (
        <div className="to__between" role="status">
          {(() => {
            const nextBlock = blocks[doneCount];
            if (nextBlock === undefined) return null;
            return (
              <p className="to__next-up">
                Next up: <strong>{systemBlockKindLabel(nextBlock.kind)}</strong>
              </p>
            );
          })()}
        </div>
      )}

      {/* ── Active block panel ─────────────────────────────────────────── */}
      {activeBlock !== undefined && (
        <div className="to__block">
          {/* Block header + countdown */}
          <div className="to__block-header">
            <div className="to__block-meta">
              <span className="to__block-label">{activeBlock.label}</span>
              <p className="to__block-hint">{activeBlock.hint}</p>
            </div>
            <div
              className={`to__countdown${isCountdownLow ? ' to__countdown--low' : ''}${isCountdownExpired ? ' to__countdown--expired' : ''}`}
              aria-live="off"
              aria-label={`${formatTime(secondsLeftInBlock)} remaining`}
            >
              <Icon name="clock" size={12} tone={isCountdownLow ? 'urgent' : 'muted'} />
              <span className="to__countdown-value">{formatTime(secondsLeftInBlock)}</span>
            </div>
          </div>

          {/* Block content */}
          <div className="to__block-content">
            <BlockPanel
              block={activeBlock}
              dumpText={dumpText}
              onDumpChange={setDumpText}
              planText={planText}
              onPlanChange={setPlanText}
            />
          </div>

          {/* Controls */}
          <div className="to__actions">
            <Button
              variant="primary"
              size="lg"
              block
              onClick={handleBlockDone}
              aria-label={isLastActiveBlock ? "I’m ready — go" : 'Done — next step'}
            >
              {isLastActiveBlock ? "I’m ready — go" : 'Done — next'}
            </Button>

            <div className="to__secondary-actions">
              <Button
                variant="ghost"
                onClick={handleDecline}
                aria-label="Skip this block and reclaim the time"
              >
                Skip this, give me the time back
              </Button>

              {onPostpone !== undefined && (
                <Button
                  variant="ghost"
                  onClick={handlePostpone}
                  aria-label="Postpone 5 minutes"
                >
                  Postpone 5m
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step counter ───────────────────────────────────────────────── */}
      {activeIndex >= 0 && (
        <p className="to__footer-step" aria-label={`Step ${doneCount + 1} of ${totalSteps}`}>
          {doneCount + 1} / {totalSteps}
        </p>
      )}
    </div>
  );
}
