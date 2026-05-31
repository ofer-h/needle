import { ItemLine } from '../ItemLine';
import type { LayoutProps } from './types';
import './CompactLayout.css';

/** Dense single-column list — more on screen, less air. Group titles are small
 * uppercase eyebrow labels; rows sit close with hairline separators between
 * them. The opposite of EditorialLayout's roominess. */
export function CompactLayout({ groups }: LayoutProps) {
  return (
    <div className="compact">
      {groups.map((group) => (
        <section key={group.key} className="compact__group">
          {group.title && <p className="compact__eyebrow">{group.title}</p>}
          <div className="compact__rows">
            {group.views.map((view) => (
              <div key={view.item.id} className="compact__row">
                <ItemLine view={view} />
              </div>
            ))}
            {group.views.length === 0 && <p className="compact__empty">Nothing here.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
