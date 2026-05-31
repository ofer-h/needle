import { ItemLine } from '../ItemLine';
import type { LayoutProps } from './types';
import './EditorialLayout.css';

/** Calm, centered single column. Group titles are quiet serif eyebrows; rows
 * breathe. The out-of-box default — "as simple as can be". */
export function EditorialLayout({ groups }: LayoutProps) {
  return (
    <div className="editorial">
      {groups.map((group) => (
        <section key={group.key} className="editorial__group">
          {group.title && <h2 className="editorial__group-title">{group.title}</h2>}
          <div className="editorial__rows">
            {group.views.map((view) => (
              <ItemLine key={view.item.id} view={view} />
            ))}
            {group.views.length === 0 && <p className="editorial__empty">Nothing here.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
