import { useEffect, useState } from 'react';
import type { TorchShowPayload } from '../../../shared/ipc-contracts';
import './HeroBannerWindow.css';

const FALLBACK: TorchShowPayload = {
  correlationId: 'unknown',
  title: 'Heads up',
  subtitle: 'Time to move',
  durationMs: 30_000,
};

export default function HeroBannerWindow() {
  const [payload, setPayload] = useState<TorchShowPayload>(FALLBACK);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onPayload((next) => setPayload(next));
    return unsub;
  }, []);

  function dismiss() {
    window.api?.torch.dismiss({ reason: 'acknowledged', correlationId: payload.correlationId });
  }

  return (
    <div className="hero-banner" role="alert" aria-live="assertive">
      <div className="hero-banner__copy">
        <span className="hero-banner__title">{payload.title}</span>
        <span className="hero-banner__subtitle">{payload.subtitle}</span>
      </div>
      <button type="button" className="hero-banner__cta" onClick={dismiss}>
        Got it
      </button>
    </div>
  );
}
