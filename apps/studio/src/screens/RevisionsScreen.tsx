import { RevisionTimeline, type Revision } from '@needle/ui-web';
import './screens.css';

type RevisionsScreenProps = {
  revisions: Revision[];
  onUndo: (id: string) => void;
};

export function RevisionsScreen({ revisions, onUndo }: RevisionsScreenProps) {
  return (
    <div className="screen">
      <h1 className="screen__title">Revisions</h1>
      <p className="screen__lede">
        Every change, newest first — AI actions flagged. Wrong ticket id, mis-parsed task?
        One click reverts it. This is the trust layer.
      </p>
      <RevisionTimeline revisions={revisions} onUndo={onUndo} />
    </div>
  );
}
