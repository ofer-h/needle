import {
  addChild,
  addItem,
  InlineAdd,
  type NewItemInput,
  type ItemId,
  type TodayData,
} from '@needle/ui-web';
import './screens.css';

type AddScreenProps = {
  data: TodayData;
  setData: (next: TodayData) => void;
};

/** The add flow is just the inline composer — no separate full-screen capture.
 * Manual by default; ✨ toggles the mocked AI parse. */
export function AddScreen({ data, setData }: AddScreenProps) {
  const handleAdd = (input: NewItemInput): ItemId => {
    const result = addItem(data, input);
    setData(result.data);
    return result.itemId;
  };

  return (
    <div className="screen screen--add">
      <h1 className="screen__title">Add anything</h1>
      <p className="screen__lede">
        One composer. Type plainly, or flip ✨ on and write naturally — “standup 10am
        for 15m”, “remember to call the dentist”. Use <code>*</code> for an item and{' '}
        <code>**</code> to nest a subtask under the last one.
      </p>
      <InlineAdd onAdd={handleAdd} onAddChild={(pid, title) => setData(addChild(data, pid, title))} />
      <p className="screen__hint">Added items show up on the Today screen.</p>
    </div>
  );
}
