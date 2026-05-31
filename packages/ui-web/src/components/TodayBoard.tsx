import { useMemo } from 'react';
import {
  addChild as addChildMut,
  assignTag as assignTagMut,
  buildTodayView,
  createTag as createTagMut,
  deleteItem as deleteItemMut,
  effectiveLayout,
  groupViews,
  moveToTarget,
  setItemTitle,
  toggleItemDone,
  unassignTag as unassignTagMut,
  type DayTarget,
  type ItemId,
  type TagColor,
  type TagId,
  type Template,
  type TodayData,
} from '../model';
import { BoardProvider, type BoardHandlers } from './BoardContext';
import { LAYOUT_REGISTRY } from './layouts';
import './TodayBoard.css';

type TodayBoardProps = {
  data: TodayData;
  template: Template;
  now?: Date;
  /** Host owns the data; the board hands back the next snapshot on every edit. */
  onChange: (next: TodayData) => void;
};

/** Renders today's items through the active template's layout. Computes the
 * view + grouping, wires mutation handlers, and delegates visuals to a
 * registered layout. Layouts never mutate — they call these handlers. */
export function TodayBoard({ data, template, now = new Date(), onChange }: TodayBoardProps) {
  const handlers = useMemo<BoardHandlers>(
    () => ({
      toggleDone: (id: ItemId) => onChange(toggleItemDone(data, id)),
      setTitle: (id: ItemId, title: string) => onChange(setItemTitle(data, id, title)),
      addChild: (parentId: ItemId, title: string) => onChange(addChildMut(data, parentId, title)),
      removeItem: (id: ItemId) => onChange(deleteItemMut(data, id)),
      moveTo: (id: ItemId, target: DayTarget) => onChange(moveToTarget(data, id, target, now)),
      assignTag: (id: ItemId, tagId: string) => onChange(assignTagMut(data, id, tagId as TagId)),
      unassignTag: (id: ItemId, tagId: string) =>
        onChange(unassignTagMut(data, id, tagId as TagId)),
      createAndAssignTag: (id: ItemId, name: string, color: TagColor) => {
        const { data: withTag, tag } = createTagMut(data, name, color);
        onChange(assignTagMut(withTag, id, tag.id));
      },
    }),
    [data, now, onChange],
  );

  const groups = useMemo(
    () => groupViews(buildTodayView(data, now), template, now),
    [data, template, now],
  );

  const Layout = LAYOUT_REGISTRY[effectiveLayout(template)];

  return (
    <BoardProvider value={{ data, now, template, handlers }}>
      <div className="today-board" data-density={template.density} data-accent={template.accent}>
        <Layout groups={groups} template={template} />
      </div>
    </BoardProvider>
  );
}
