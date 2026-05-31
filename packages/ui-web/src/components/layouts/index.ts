import type { ComponentType } from 'react';
import type { TemplateLayout } from '../../model';
import type { LayoutProps } from './types';
import { EditorialLayout } from './EditorialLayout';
import { CompactLayout } from './CompactLayout';
import { TimelineLayout } from './TimelineLayout';
import { KanbanLayout } from './KanbanLayout';

/** The open/closed renderer registry. Adding a layout = registering a component
 * here; 'custom' templates resolve to their baseLayout before lookup. */
export const LAYOUT_REGISTRY: Record<
  Exclude<TemplateLayout, 'custom'>,
  ComponentType<LayoutProps>
> = {
  editorial: EditorialLayout,
  compact: CompactLayout,
  timeline: TimelineLayout,
  kanban: KanbanLayout,
};

export { EditorialLayout, CompactLayout, TimelineLayout, KanbanLayout };
export type { LayoutProps } from './types';
