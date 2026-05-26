import { useEffect } from 'react';
import type { Intervention } from '../../../shared/domain-v2';
import { Button } from '../primitives/Button';
import './EscalatedBanner.css';

type Props = {
  intervention: Intervention;
  onDismiss: () => void;
};

export default function EscalatedBanner({ intervention, onDismiss }: Props) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const title = typeof intervention.payload.title === 'string' ? intervention.payload.title : 'You missed it';
  const subtitle =
    typeof intervention.payload.subtitle === 'string' ? intervention.payload.subtitle : 'Recover quickly.';

  return (
    <div className="escalated-banner" role="alert" aria-live="assertive">
      <div className="escalated-banner__body">
        <div className="escalated-banner__copy">
          <span className="escalated-banner__title">{title}</span>
          <span className="escalated-banner__subtitle">{subtitle}</span>
        </div>
        <Button size="sm" onClick={onDismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
