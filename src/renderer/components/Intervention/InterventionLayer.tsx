import { useEffect, useMemo, useState } from 'react';
import type { ISODateTime, Intervention, ItemId } from '../../../shared/domain-v2';
import { useV2Store } from '../../state/store-v2';
import { nowIso, useDevClock } from '../../utils/dev-clock';
import EscalatedBanner from './EscalatedBanner';
import ModalCapture from './ModalCapture';
import Torchlight from './Torchlight';

function getTargetRect(targetItemId: string | undefined): DOMRect | null {
  if (targetItemId === undefined) return null;
  const el = document.querySelector(`[data-v2-item-id="${targetItemId}"]`);
  return el?.getBoundingClientRect() ?? null;
}

export default function InterventionLayer() {
  const meActorId = useV2Store((s) => s.meActorId);
  const interventions = useV2Store((s) => s.interventions);
  const captureEntries = useV2Store((s) => s.captureEntries);
  const activateIntervention = useV2Store((s) => s.activateIntervention);
  const resolveIntervention = useV2Store((s) => s.resolveIntervention);
  const escalateIntervention = useV2Store((s) => s.escalateIntervention);
  const frozenIso = useDevClock((s) => s.frozenIso);

  const now: ISODateTime = (frozenIso ?? (new Date().toISOString() as ISODateTime)) as ISODateTime;
  const nowMs = Date.parse(now);

  const surfacing = useMemo(() => {
    return interventions.filter((i) => {
      if (i.actorId !== meActorId) return false;
      if (i.archivedAt !== undefined) return false;
      if (i.status === 'active') return true;
      if (i.status === 'scheduled' && Date.parse(i.scheduledFor) <= nowMs) return true;
      return false;
    });
  }, [interventions, meActorId, nowMs]);

  const scheduledDueIds = surfacing
    .filter((i) => i.status === 'scheduled')
    .map((i) => i.id)
    .join(',');

  useEffect(() => {
    if (scheduledDueIds === '') return;
    scheduledDueIds.split(',').forEach((id) => {
      activateIntervention(id as Intervention['id'], now);
    });
  }, [scheduledDueIds, now, activateIntervention]);

  if (surfacing.length === 0) return null;

  const top = [...surfacing].sort((a, b) => b.intensity - a.intensity)[0]!;

  if (top.strategy === 'modal_capture') {
    const entries = captureEntries.filter(
      (e) => e.flowSessionId === top.flowSessionId && e.actorId === meActorId,
    );
    return (
      <ModalCapture
        intervention={top}
        entries={entries}
        onClose={() => {
          /* resolveIntervention is called inside ModalCapture's handleClose */
        }}
      />
    );
  }

  if (top.strategy === 'attention_takeover_torch') {
    const targetItemId = typeof top.payload.targetItemId === 'string' ? top.payload.targetItemId : undefined;
    const title = typeof top.payload.title === 'string' ? top.payload.title : 'Time to move';
    const subtitle = typeof top.payload.subtitle === 'string' ? top.payload.subtitle : 'Acknowledge to continue.';
    return (
      <TorchlightForTarget
        targetItemId={targetItemId as ItemId | undefined}
        title={title}
        subtitle={subtitle}
        onAcknowledge={() => resolveIntervention(top.id, 'acknowledged', nowIso())}
        onTimeout={() => escalateIntervention(top.id, nowIso())}
      />
    );
  }

  if (top.strategy === 'escalated_alert') {
    return (
      <EscalatedBanner
        intervention={top}
        onDismiss={() => resolveIntervention(top.id, 'acknowledged', nowIso())}
      />
    );
  }

  return null;
}

/**
 * Re-measures the target's DOMRect on resize and a short interval so the
 * spotlight tracks layout shifts during the slice. Cheap for one element.
 */
function TorchlightForTarget(props: {
  targetItemId: ItemId | undefined;
  title: string;
  subtitle: string;
  onAcknowledge: () => void;
  onTimeout: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(() => getTargetRect(props.targetItemId));

  useEffect(() => {
    function measure() {
      setRect(getTargetRect(props.targetItemId));
    }
    measure();
    const interval = window.setInterval(measure, 500);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [props.targetItemId]);

  return (
    <Torchlight
      active
      title={props.title}
      subtitle={props.subtitle}
      targetRect={rect}
      onAcknowledge={props.onAcknowledge}
      onTimeout={props.onTimeout}
    />
  );
}
