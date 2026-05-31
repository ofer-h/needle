import { BrainDump } from '@needle/ui-web';
import './screens.css';

export function BrainDumpScreen() {
  return (
    <div className="screen">
      <h1 className="screen__title">Brain dump</h1>
      <p className="screen__lede">
        The transition ritual — five minutes to empty your head, five to pick the next
        move, five to reset. Each block has its own timer; skipping the dump costs you the
        most drift.
      </p>
      <BrainDump />
    </div>
  );
}
