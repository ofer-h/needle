import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useDevClock } from '../../utils/dev-clock';
import './DevClockControl.css';

const PRESET_TIMES = ['09:00', '14:54', '14:55', '14:59', '15:00', '15:01'] as const;

const STORAGE_KEY = 'needle.devClock.position';

type Position = { x: number; y: number };

function readStoredPosition(): Position | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function clampToViewport(p: Position, el: HTMLElement | null): Position {
  if (el === null) return p;
  const rect = el.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width;
  const maxY = window.innerHeight - rect.height;
  return {
    x: Math.min(Math.max(0, p.x), Math.max(0, maxX)),
    y: Math.min(Math.max(0, p.y), Math.max(0, maxY)),
  };
}

export default function DevClockControl() {
  const frozenIso = useDevClock((s) => s.frozenIso);
  const jumpToTime = useDevClock((s) => s.jumpToTime);
  const setFrozen = useDevClock((s) => s.setFrozen);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const [position, setPosition] = useState<Position | null>(() => readStoredPosition());

  useEffect(() => {
    if (position === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      /* ignore */
    }
  }, [position]);

  useEffect(() => {
    function onResize() {
      setPosition((prev) => (prev === null ? prev : clampToViewport(prev, rootRef.current)));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const el = rootRef.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const off = dragOffset.current;
    if (off === null) return;
    const next = clampToViewport(
      { x: e.clientX - off.dx, y: e.clientY - off.dy },
      rootRef.current,
    );
    setPosition(next);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragOffset.current === null) return;
    dragOffset.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  const label =
    frozenIso === null
      ? 'live'
      : new Date(frozenIso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

  const positionStyle =
    position === null ? undefined : { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' };

  return (
    <div
      ref={rootRef}
      className="dev-clock"
      role="group"
      aria-label="Developer clock control"
      style={positionStyle}
    >
      <div
        className="dev-clock__row dev-clock__handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag to move"
      >
        <span className="dev-clock__grip" aria-hidden="true">⋮⋮</span>
        <span className="dev-clock__label">Clock</span>
        <span className="dev-clock__time">{label}</span>
        {frozenIso !== null && (
          <button
            type="button"
            className="dev-clock__resume"
            onClick={() => setFrozen(null)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            resume
          </button>
        )}
      </div>
      <div className="dev-clock__row dev-clock__buttons">
        {PRESET_TIMES.map((t) => (
          <button
            key={t}
            type="button"
            className="dev-clock__preset"
            onClick={() => {
              console.info('[DevClock] jump', t);
              jumpToTime(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
