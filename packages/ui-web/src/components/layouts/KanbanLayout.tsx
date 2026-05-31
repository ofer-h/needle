import { ItemLine } from '../ItemLine';
import type { LayoutProps } from './types';
import './KanbanLayout.css';

/** Side-by-side status columns — the classic kanban board. Groups map to lanes
 * (To do / Doing / Done). Empty lanes are always rendered so the board keeps
 * its full shape even when a column has no items. */
export function KanbanLayout({ groups }: LayoutProps) {
  return (
    <div className="kanban">
      {groups.map((group) => (
        <section key={group.key} className="kanban__column" aria-label={group.title}>
          <header className="kanban__column-header">
            {group.title && <span className="kanban__column-title">{group.title}</span>}
            <span className="kanban__column-count" aria-label={`${group.views.length} items`}>
              {group.views.length}
            </span>
          </header>
          <div className="kanban__column-body">
            {group.views.map((view) => (
              <ItemLine key={view.item.id} view={view} />
            ))}
            {group.views.length === 0 && (
              <p className="kanban__empty" aria-hidden>
                Nothing here
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
