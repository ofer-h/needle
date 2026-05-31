import { useRef, useState } from 'react';
import {
  applyChat,
  buildTodayView,
  Countdown,
  createFeedbackBus,
  defaultFeedbackConfig,
  defaultNotificationConfig,
  defaultTransitionSettings,
  Icon,
  RevisionLog,
  type AccountabilityMode,
  type FeedbackBus,
  type IconName,
  type NotificationConfig,
  type Revision,
  type TodayData,
  type TransitionSettings,
} from '@needle/ui-web';
import { useTheme } from './theme';
import { useScenarioClock } from './clock';
import { createBrowserFeedbackSink } from './feedback';
import { makeSeed } from './mock/seed';
import { TodayScreen } from './screens/TodayScreen';
import { AddScreen } from './screens/AddScreen';
import { EventsScreen } from './screens/EventsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { BrainDumpScreen } from './screens/BrainDumpScreen';
import { CoachScreen } from './screens/CoachScreen';
import { ChatScreen } from './screens/ChatScreen';
import { RevisionsScreen } from './screens/RevisionsScreen';
import { TemplatesScreen } from './screens/TemplatesScreen';
import { GalleryScreen } from './screens/GalleryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TransitionScreen } from './screens/TransitionScreen';
import { useTemplates, type TemplatesApi } from './templates';

/** Build a single feedback bus for the lifetime of the app. */
const feedbackBus: FeedbackBus = createFeedbackBus(
  () => defaultFeedbackConfig(),
  createBrowserFeedbackSink(),
);

type ScenarioKey =
  | 'today'
  | 'add'
  | 'events'
  | 'braindump'
  | 'transition'
  | 'coach'
  | 'chat'
  | 'notifications'
  | 'settings'
  | 'revisions'
  | 'templates'
  | 'gallery';

type Scenario = { key: ScenarioKey; label: string; icon: IconName; group: string };

const SCENARIOS: Scenario[] = [
  { key: 'today', label: 'Today', icon: 'check', group: 'Plan' },
  { key: 'add', label: 'Add', icon: 'plus', group: 'Plan' },
  { key: 'events', label: 'Events', icon: 'calendar', group: 'Plan' },
  { key: 'braindump', label: 'Brain dump', icon: 'spark', group: 'Plan' },
  { key: 'transition', label: 'Transition', icon: 'clock', group: 'Plan' },
  { key: 'coach', label: 'Coach', icon: 'coach', group: 'Coach' },
  { key: 'chat', label: 'Chat', icon: 'chat', group: 'Coach' },
  { key: 'notifications', label: 'Notifications', icon: 'bell', group: 'Setup' },
  { key: 'settings', label: 'Settings', icon: 'layout', group: 'Setup' },
  { key: 'revisions', label: 'Revisions', icon: 'undo', group: 'Setup' },
  { key: 'templates', label: 'Templates', icon: 'layout', group: 'System' },
  { key: 'gallery', label: 'Components', icon: 'dots', group: 'System' },
];

const GROUPS = ['Plan', 'Coach', 'Setup', 'System'];

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [active, setActive] = useState<ScenarioKey>('today');
  const [data, setData] = useState<TodayData>(() => makeSeed());
  const [config, setConfig] = useState<NotificationConfig>(defaultNotificationConfig);
  const [transitionSettings, setTransitionSettings] = useState<TransitionSettings>(
    () => defaultTransitionSettings(),
  );
  const [coachMode, setCoachMode] = useState<AccountabilityMode>('coached');
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const revLog = useRef(new RevisionLog());
  const clock = useScenarioClock();
  const templates = useTemplates();
  const current = SCENARIOS.find((s) => s.key === active)!;
  const views = buildTodayView(data, clock.now);

  /** Wrapped setter that fires feedback events for adds and completions. */
  const setDataWithFeedback = (next: TodayData) => {
    const prevCount = data.items.length;
    const prevDone = data.items.filter((i) => i.status === 'done').length;
    const nextCount = next.items.length;
    const nextDone = next.items.filter((i) => i.status === 'done').length;
    setData(next);
    if (nextCount > prevCount) feedbackBus.emit('item.added');
    if (nextDone > prevDone) {
      feedbackBus.emit('item.completed');
      if (prevDone === 0) feedbackBus.emit('item.firstCompleted');
    }
  };

  const chatSend = (text: string): { reply: string; revisionId?: string } => {
    const result = applyChat(data, text);
    setDataWithFeedback(result.data);
    if (result.revision) {
      const rev = revLog.current.push(result.revision);
      setRevisions(revLog.current.all());
      return { reply: result.reply, revisionId: rev.id };
    }
    return { reply: result.reply };
  };

  const undoRevision = (id: string) => {
    const before = revLog.current.undo(id);
    if (before) setData(before);
    setRevisions(revLog.current.all());
  };

  return (
    <div className="studio">
      <aside className="studio-rail">
        <div className="studio-brand">
          <span className="studio-brand__mark">N</span>
          <span className="studio-brand__name">Studio</span>
        </div>
        {GROUPS.map((group) => (
          <div key={group} className="studio-nav-group">
            <div className="studio-nav-group__title">{group}</div>
            {SCENARIOS.filter((s) => s.group === group).map((s) => (
              <button
                key={s.key}
                className={`studio-nav-item${active === s.key ? ' studio-nav-item--active' : ''}`}
                onClick={() => setActive(s.key)}
              >
                <span className="studio-nav-item__icon">
                  <Icon name={s.icon} size={15} tone={active === s.key ? 'default' : 'muted'} />
                </span>
                {s.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="studio-main">
        <header className="studio-topbar">
          <span className="studio-topbar__title">{current.label}</span>
          <Countdown views={views} now={clock.now} variant="badge" />
          <span className="studio-topbar__spacer" />
          <ClockBar
            now={clock.now}
            live={clock.live}
            onJump={clock.jump}
            onReset={clock.reset}
            onToggleLive={clock.toggleLive}
          />
          <button
            className="studio-iconbtn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
          </button>
        </header>

        <div className="studio-content">
          <Screen
            scenario={active}
            data={data}
            setData={setDataWithFeedback}
            now={clock.now}
            config={config}
            setConfig={setConfig}
            transitionSettings={transitionSettings}
            onTransitionSettingsChange={setTransitionSettings}
            coachMode={coachMode}
            setCoachMode={setCoachMode}
            revisions={revisions}
            templates={templates}
            onChatSend={chatSend}
            onUndoRevision={undoRevision}
            onJumpClock={clock.jump}
          />
        </div>
      </main>
    </div>
  );
}

function ClockBar({
  now,
  live,
  onJump,
  onReset,
  onToggleLive,
}: {
  now: Date;
  live: boolean;
  onJump: (m: number) => void;
  onReset: () => void;
  onToggleLive: () => void;
}) {
  const label = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="studio-clock" title="Scenario clock — fast-forward to watch the countdown rotate">
      <button className="studio-clock__btn" onClick={onToggleLive} aria-label={live ? 'Pause clock' : 'Run clock'}>
        <Icon name={live ? 'pause' : 'play'} size={12} />
      </button>
      <span className="studio-clock__time">{label}</span>
      <button className="studio-clock__btn" onClick={() => onJump(5)}>+5m</button>
      <button className="studio-clock__btn" onClick={() => onJump(15)}>+15m</button>
      <button className="studio-clock__btn" onClick={() => onJump(60)}>+1h</button>
      <button className="studio-clock__btn studio-clock__btn--reset" onClick={onReset} aria-label="Reset clock">
        <Icon name="undo" size={12} />
      </button>
    </div>
  );
}

function Screen({
  scenario,
  data,
  setData,
  now,
  config,
  setConfig,
  transitionSettings,
  onTransitionSettingsChange,
  coachMode,
  setCoachMode,
  revisions,
  templates,
  onChatSend,
  onUndoRevision,
  onJumpClock,
}: {
  scenario: ScenarioKey;
  data: TodayData;
  setData: (next: TodayData) => void;
  now: Date;
  config: NotificationConfig;
  setConfig: (next: NotificationConfig) => void;
  transitionSettings: TransitionSettings;
  onTransitionSettingsChange: (next: TransitionSettings) => void;
  coachMode: AccountabilityMode;
  setCoachMode: (mode: AccountabilityMode) => void;
  revisions: Revision[];
  templates: TemplatesApi;
  onChatSend: (text: string) => { reply: string; revisionId?: string };
  onUndoRevision: (id: string) => void;
  onJumpClock: (minutes: number) => void;
}) {
  if (scenario === 'today')
    return <TodayScreen data={data} setData={setData} now={now} templates={templates} />;
  if (scenario === 'add') return <AddScreen data={data} setData={setData} />;
  if (scenario === 'events') return <EventsScreen data={data} setData={setData} now={now} />;
  if (scenario === 'notifications') return <NotificationsScreen config={config} setConfig={setConfig} />;
  if (scenario === 'settings')
    return (
      <SettingsScreen
        transition={transitionSettings}
        onTransitionChange={onTransitionSettingsChange}
        notifications={config}
        onNotificationsChange={setConfig}
      />
    );
  if (scenario === 'braindump') return <BrainDumpScreen />;
  if (scenario === 'transition')
    return (
      <TransitionScreen
        data={data}
        now={now}
        transitionSettings={transitionSettings}
        onJumpClock={onJumpClock}
      />
    );
  if (scenario === 'coach')
    return <CoachScreen data={data} now={now} mode={coachMode} setMode={setCoachMode} />;
  if (scenario === 'chat') return <ChatScreen onSend={onChatSend} onUndo={onUndoRevision} />;
  if (scenario === 'revisions')
    return <RevisionsScreen revisions={revisions} onUndo={onUndoRevision} />;
  if (scenario === 'templates') return <TemplatesScreen templates={templates} />;
  if (scenario === 'gallery') return <GalleryScreen />;

  return null;
}
