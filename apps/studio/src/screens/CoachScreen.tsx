import {
  buildTodayView,
  CoachPanel,
  type AccountabilityMode,
  type TodayData,
} from '@needle/ui-web';
import './screens.css';

type CoachScreenProps = {
  data: TodayData;
  now: Date;
  mode: AccountabilityMode;
  setMode: (mode: AccountabilityMode) => void;
};

export function CoachScreen({ data, now, mode, setMode }: CoachScreenProps) {
  const views = buildTodayView(data, now);
  return (
    <div className="screen">
      <h1 className="screen__title">Coach</h1>
      <p className="screen__lede">
        The coach reads today plus how you’re tracking and decides what to push next. The
        same signals, three voices — pick the one that actually moves you.
      </p>
      <CoachPanel views={views} now={now} mode={mode} onModeChange={setMode} />
    </div>
  );
}
