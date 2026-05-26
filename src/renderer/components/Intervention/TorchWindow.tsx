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
  const [cursor, setCursor] = useState<{ x: number; y: number }>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onPayload((next) => setPayload(next));
    return unsub;
  }, []);

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      setCursor({ x: event.clientX, y: event.clientY });
    }
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
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
        cursor={{ x: cursor.x, y: cursor.y, radius: 180 }}
        timeoutMs={effective.durationMs}
        onAcknowledge={() => dismiss('acknowledged')}
        onTimeout={() => dismiss('timeout')}
      />
    </div>
  );
}
