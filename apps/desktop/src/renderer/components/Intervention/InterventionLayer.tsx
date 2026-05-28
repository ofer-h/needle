import { useEffect, useMemo, useRef } from 'react';
import type { ISODateTime, InterventionId } from '@needle/domain/domain-v2';
import { useV2Store } from '../../state/store-v2';
import { nowIso, useDevClock } from '../../utils/dev-clock';
import EscalatedBanner from './EscalatedBanner';

export default function InterventionLayer() {
  const meActorId = useV2Store((s) => s.meActorId);
  const interventions = useV2Store((s) => s.interventions);
  const items = useV2Store((s) => s.items);
  const itemOccurrences = useV2Store((s) => s.itemOccurrences);
  const captureEntries = useV2Store((s) => s.captureEntries);
  const activateIntervention = useV2Store((s) => s.activateIntervention);
  const resolveIntervention = useV2Store((s) => s.resolveIntervention);
  const escalateIntervention = useV2Store((s) => s.escalateIntervention);
  const addCaptureEntry = useV2Store((s) => s.addCaptureEntry);
  const promoteCaptureEntry = useV2Store((s) => s.promoteCaptureEntry);
  const dismissCaptureEntry = useV2Store((s) => s.dismissCaptureEntry);
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

  // Track which standalone windows we currently have open.
  const lastTorchIdRef = useRef<InterventionId | null>(null);
  const lastCaptureIdRef = useRef<InterventionId | null>(null);
  // Map capture window's local entryId → v2 store CaptureEntryId so promote/dismiss can find them.
  const entryIdMap = useRef(new Map<string, ReturnType<typeof addCaptureEntry>>());

  // Drive the system-level torch window.
  useEffect(() => {
    if (window.api?.torch === undefined) {
      if (top?.strategy === 'attention_takeover_torch') {
        console.warn('[InterventionLayer] torch intervention active but window.api.torch is undefined — preload likely stale. Full-quit and restart npm start.');
      }
      return;
    }
    const activeTorch = top?.strategy === 'attention_takeover_torch' ? top : null;
    if (activeTorch !== null && activeTorch.id !== lastTorchIdRef.current) {
      const title = typeof activeTorch.payload.title === 'string' ? activeTorch.payload.title : 'Time to move';
      const subtitle =
        typeof activeTorch.payload.subtitle === 'string' ? activeTorch.payload.subtitle : 'Acknowledge to continue.';
      // Check whether the linked item is an unmissable commitment so the banner
      // can offer meeting-safe snooze durations instead of longer task delays.
      const linkedItem = activeTorch.itemId !== undefined
        ? items.find((i) => i.id === activeTorch.itemId)
        : undefined;
      const isMeeting = linkedItem?.commitmentLevel === 'unmissable';
      // Resolve the linked occurrence's start time for the banner countdown.
      let meetingStartTime: string | undefined;
      if (activeTorch.occurrenceId !== undefined) {
        const occ = itemOccurrences.find((o) => o.id === activeTorch.occurrenceId);
        if (occ !== undefined) {
          const dt = new Date(occ.startsAt);
          meetingStartTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        }
      }
      console.info('[InterventionLayer] torch.show', { id: activeTorch.id, title, isMeeting, meetingStartTime });
      window.api.torch.show({
        correlationId: activeTorch.id,
        title,
        subtitle,
        durationMs: 30_000,
        isMeeting,
        ...(meetingStartTime !== undefined ? { meetingStartTime } : {}),
      });
      lastTorchIdRef.current = activeTorch.id;
    } else if (activeTorch === null && lastTorchIdRef.current !== null) {
      window.api.torch.hide();
      lastTorchIdRef.current = null;
    }
  }, [top, items, itemOccurrences]);

  // Drive the standalone capture window.
  useEffect(() => {
    if (window.api?.capture === undefined) {
      if (top?.strategy === 'modal_capture') {
        console.warn('[InterventionLayer] capture intervention active but window.api.capture is undefined — preload likely stale. Full-quit and restart npm start.');
      }
      return;
    }
    const activeCapture = top?.strategy === 'modal_capture' ? top : null;
    if (activeCapture !== null && activeCapture.id !== lastCaptureIdRef.current) {
      const title = typeof activeCapture.payload.title === 'string' ? activeCapture.payload.title : 'Brain-dump';
      const subtitle =
        typeof activeCapture.payload.subtitle === 'string'
          ? activeCapture.payload.subtitle
          : 'Anything on your mind before the next thing?';
      console.info('[InterventionLayer] capture.show', { id: activeCapture.id, title });
      window.api.capture.show({
        correlationId: activeCapture.id,
        title,
        subtitle,
      });
      lastCaptureIdRef.current = activeCapture.id;
    } else if (activeCapture === null && lastCaptureIdRef.current !== null) {
      window.api.capture.hide();
      lastCaptureIdRef.current = null;
    }
  }, [top]);

  // Receive torch close events.
  useEffect(() => {
    if (window.api?.torch === undefined || window.api?.capture === undefined) return;
    const unsub = window.api.torch.onClosed((payload) => {
      const id = payload.correlationId as InterventionId;
      if (payload.reason === 'acknowledged' || payload.reason === 'skipped') {
        // If the user left a brain dump, save it as a capture entry.
        if (typeof payload.brainDumpText === 'string' && payload.brainDumpText.length > 0) {
          addCaptureEntry({ body: payload.brainDumpText });
          void window.api.db.addCapture(payload.brainDumpText);
        }
        resolveIntervention(id, 'acknowledged', nowIso());
      } else {
        escalateIntervention(id, nowIso());
      }
    });
    return unsub;
  }, [addCaptureEntry, resolveIntervention, escalateIntervention]);

  // Receive capture events.
  useEffect(() => {
    if (window.api?.torch === undefined || window.api?.capture === undefined) return;
    const offAdded = window.api.capture.onEntryAdded((payload) => {
      const flowSessionId = top?.flowSessionId;
      const storeEntryId = addCaptureEntry({
        body: payload.body,
        ...(flowSessionId !== undefined ? { flowSessionId } : {}),
      });
      entryIdMap.current.set(payload.entryId, storeEntryId);
      void window.api.db.addCapture(payload.body);
    });
    const offPromoted = window.api.capture.onEntryPromoted((payload) => {
      const storeEntryId = entryIdMap.current.get(payload.entryId);
      if (storeEntryId !== undefined) promoteCaptureEntry(storeEntryId);
    });
    const offDismissed = window.api.capture.onEntryDismissed((payload) => {
      const storeEntryId = entryIdMap.current.get(payload.entryId);
      if (storeEntryId !== undefined) dismissCaptureEntry(storeEntryId);
    });
    const offClosed = window.api.capture.onClosed((payload) => {
      const id = payload.correlationId as InterventionId;
      resolveIntervention(id, payload.reason === 'completed' ? 'completed' : 'dismissed', nowIso());
      lastCaptureIdRef.current = null;
      entryIdMap.current.clear();
    });
    return () => {
      offAdded();
      offPromoted();
      offDismissed();
      offClosed();
    };
  }, [addCaptureEntry, promoteCaptureEntry, dismissCaptureEntry, resolveIntervention, top?.flowSessionId]);

  // Avoid an unused-vars lint hit for now — captureEntries kept around for future selectors.
  void captureEntries;

  if (top === null) return null;

  if (top.strategy === 'escalated_alert') {
    return (
      <EscalatedBanner
        intervention={top}
        onDismiss={() => resolveIntervention(top.id, 'acknowledged', nowIso())}
      />
    );
  }

  // Torch and modal_capture are rendered by separate Electron windows via IPC effects above.
  return null;
}
