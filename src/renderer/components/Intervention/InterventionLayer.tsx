import { useEffect, useMemo, useRef } from 'react';
import type { ISODateTime, InterventionId } from '../../../shared/domain-v2';
import { useV2Store } from '../../state/store-v2';
import { nowIso, useDevClock } from '../../utils/dev-clock';
import EscalatedBanner from './EscalatedBanner';
import ModalCapture from './ModalCapture';

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
      activateIntervention(id as InterventionId, now);
    });
  }, [scheduledDueIds, now, activateIntervention]);

  const top = surfacing.length === 0 ? null : [...surfacing].sort((a, b) => b.intensity - a.intensity)[0]!;
  const activeTorchId = top?.strategy === 'attention_takeover_torch' ? top.id : null;
  const activeTorchIntervention = activeTorchId !== null ? top : null;
  const lastTorchIdRef = useRef<InterventionId | null>(null);

  // Drive the system-level torch window through IPC.
  useEffect(() => {
    if (window.api === undefined) return;
    if (activeTorchIntervention !== null && activeTorchId !== lastTorchIdRef.current) {
      const title =
        typeof activeTorchIntervention.payload.title === 'string'
          ? activeTorchIntervention.payload.title
          : 'Time to move';
      const subtitle =
        typeof activeTorchIntervention.payload.subtitle === 'string'
          ? activeTorchIntervention.payload.subtitle
          : 'Acknowledge to continue.';
      window.api.torch.show({
        correlationId: activeTorchIntervention.id,
        title,
        subtitle,
        durationMs: 30_000,
      });
      lastTorchIdRef.current = activeTorchId;
    } else if (activeTorchIntervention === null && lastTorchIdRef.current !== null) {
      window.api.torch.hide();
      lastTorchIdRef.current = null;
    }
  }, [activeTorchId, activeTorchIntervention]);

  // Receive torch close events and route to the right store action.
  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onClosed((payload) => {
      const id = payload.correlationId as InterventionId;
      if (payload.reason === 'acknowledged') {
        resolveIntervention(id, 'acknowledged', nowIso());
      } else {
        escalateIntervention(id, nowIso());
      }
    });
    return unsub;
  }, [resolveIntervention, escalateIntervention]);

  if (surfacing.length === 0) return null;
  if (top === null) return null;

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
    // Rendered by the system torch BrowserWindow via IPC effect above. Nothing to render in-window.
    return null;
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
