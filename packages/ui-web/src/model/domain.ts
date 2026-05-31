/* Canonical re-export. The rich, already-designed entity model lives in
 * @needle/domain (domain-v2.ts): Item, ItemPlan, ItemOccurrence, ItemRelation,
 * Suggestion, Intervention, Ritual, CaptureEntry, NotificationPreference,
 * ActivityLog, TodayItemView, DailyFlowView, and all branded ids.
 *
 * ui-web reuses these verbatim rather than inventing parallel shapes. New
 * presentation-only types (templates, countdown, coach, chat, revisions) live
 * beside this file and are documented as "promote into @needle/domain once
 * validated" so the shipping domain package stays stable. */

export * from '@needle/domain/domain-v2';
