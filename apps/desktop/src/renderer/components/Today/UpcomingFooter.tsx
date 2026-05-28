import { Divider } from '../primitives/Divider';
import { Icon } from '../primitives/Icon';
import { Pill } from '../primitives/Pill';
import './UpcomingFooter.css';

type Props = {
  items: string[];
  expanded: boolean;
  onToggle: () => void;
};

export default function UpcomingFooter({ items, expanded, onToggle }: Props) {
  return (
    <>
      <div className="upcoming-footer">
        <Divider />
        <button
          type="button"
          className="upcoming-footer__toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls="upcoming-list"
          aria-label={expanded ? 'Hide upcoming tasks' : 'Show upcoming tasks'}
        >
          <span>Upcoming</span>
          <Pill size="sm" tabular>
            {items.length}
          </Pill>
          <Icon name="chevron" size={11} tone="inherit" rotate={expanded ? 270 : 90} />
        </button>
        <Divider />
      </div>

      {expanded && (
        <div className="upcoming-footer__list" id="upcoming-list">
          {items.map((title) => (
            <div key={title} className="upcoming-footer__item">
              {title}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
