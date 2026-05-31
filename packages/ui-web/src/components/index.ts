/* Feature components. Populated across phases:
 *   Phase 1  TodayBoard, ItemLine, InlineAdd, ProgressKudos, layouts  ✅
 *   Phase 2  Countdown, EventEditor, NotificationSettings
 *   Phase 3  BrainDump, CoachPanel, ChatDock, RevisionTimeline
 *   Phase 4  TemplateGallery, TemplateBuilder */

export { TodayBoard } from './TodayBoard';
export { ItemLine } from './ItemLine';
export { InlineAdd } from './InlineAdd';
export { ProgressKudos } from './ProgressKudos';
export { Countdown } from './Countdown';
export { NotificationSettings } from './NotificationSettings';
export { EventEditor } from './EventEditor';
export { BrainDump } from './BrainDump';
export { CoachPanel } from './CoachPanel';
export { ChatDock } from './ChatDock';
export { RevisionTimeline } from './RevisionTimeline';
export { TemplateBuilder } from './TemplateBuilder';
export { useBoard, BoardProvider } from './BoardContext';
export type { BoardHandlers, BoardContextValue } from './BoardContext';
export { LAYOUT_REGISTRY, EditorialLayout, CompactLayout, TimelineLayout, KanbanLayout } from './layouts';
export type { LayoutProps } from './layouts';
