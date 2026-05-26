import { useEffect, useState } from 'react';
import type { TorchShowPayload } from '../../../shared/ipc-contracts';
import Torchlight from './Torchlight';
import './TorchWindow.css';

const FALLBACK: TorchShowPayload = {
  correlationId: 'unknown',
  title: 'Time to move',
  subtitle: 'Acknowledge to continue.',
  durationMs: 30_000,
};

export default function TorchWindow() {
  const [payload, setPayload] = useState<TorchShowPayload | null>(null);
  // null = cursor is NOT on this window's display → render uniform dim, no spotlight.
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onPayload((next) => setPayload(next));
    return unsub;
  }, []);

  // Receive absolute screen cursor position from main. Decide if it's on
  // this window's display by checking against window.screenX/Y + window size.
  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onCursor(({ x, y }) => {
      const left = window.screenX;
      const top = window.screenY;
      const right = left + window.innerWidth;
      const bottom = top + window.innerHeight;
      if (x < left || x >= right || y < top || y >= bottom) {
        setCursor(null);
      } else {
        setCursor({ x: x - left, y: y - top });
      }
    });
    return unsub;
  }, []);

  const effective = payload ?? FALLBACK;

  function dismiss(reason: 'acknowledged' | 'timeout') {
    window.api?.torch.dismiss({ reason, correlationId: effective.correlationId });
  }

  return (
    <div className="torch-window">
      <Torchlight
        active
        title={effective.title}
        subtitle={effective.subtitle}
        targetRect={null}
        cursor={cursor === null ? null : { x: cursor.x, y: cursor.y, radius: 180 }}
        timeoutMs={effective.durationMs}
        onAcknowledge={() => dismiss('acknowledged')}
        onTimeout={() => dismiss('timeout')}
      />
    </div>
  );
}
