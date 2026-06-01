import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from './state/store';
import TodayBoardScreen from './components/Today/TodayBoardScreen';
import CaptureScreen from './components/Capture/CaptureScreen';
import SettingsScreen from './components/Settings/SettingsScreen';
import Titlebar from './components/Window/Titlebar';
import AppearanceToggle from './components/Window/AppearanceToggle';
import BuildDiagnostics from './components/DevTools/BuildDiagnostics';
import DevClockControl from './components/DevTools/DevClockControl';
// InterventionLayer superseded by TransitionLayer (single in-window overlay).
import TransitionLayer from './components/Intervention/TransitionLayer';
import { createDesktopFeedbackSink } from './feedback';
import { nowIsoFromState, useDevClock } from './utils/dev-clock';
import {
  createFeedbackBus,
  defaultFeedbackConfig,
  defaultNotificationConfig,
  defaultTransitionSettings,
  DEFAULT_TEMPLATE_ID,
  reserveIdsFromData,
  type FeedbackBus,
  type FeedbackConfig,
  type NotificationConfig,
  type TemplateId,
  type TodayData,
  type TransitionSettings,
} from '@needle/ui-web';
import type { Screen } from '@needle/domain/types';

const EMPTY_DATA: TodayData = {
  items: [],
  plans: [],
  occurrences: [],
  relations: [],
  tags: [],
  itemTags: [],
};

const LS_TRANSITION = 'needle.transition';
const LS_NOTIFICATIONS = 'needle.notifications';
const LS_FEEDBACK = 'needle.feedback';
const LS_TEMPLATE = 'needle.template';
const LS_APPEARANCE = 'needle.appearance';

/** Load a JSON value from localStorage, falling back to a default on any error. */
function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function savePersisted(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable / quota — non-fatal, skip.
  }
}

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const setScreen = useAppStore((s) => s.setScreen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const appearance = useAppStore((s) => s.appearance);
  const setAppearance = useAppStore((s) => s.setAppearance);
  const expandedItemId = useAppStore((s) => s.expandedItemId);
  const expandItem = useAppStore((s) => s.expandItem);
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);

  // Settings is layered locally rather than widening the domain-owned Screen
  // union ('today' | 'capture') used by the store, menu, and IPC navigation.
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Lifted shared state ─────────────────────────────────────────────────────
  const [todayData, setTodayData] = useState<TodayData>(EMPTY_DATA);
  const [transitionSettings, setTransitionSettings] = useState<TransitionSettings>(() =>
    loadPersisted<TransitionSettings>(LS_TRANSITION, defaultTransitionSettings()),
  );
  const [notifications, setNotifications] = useState<NotificationConfig>(() =>
    loadPersisted<NotificationConfig>(LS_NOTIFICATIONS, defaultNotificationConfig),
  );
  const [templateId, setTemplateId] = useState<TemplateId>(() =>
    loadPersisted<TemplateId>(LS_TEMPLATE, DEFAULT_TEMPLATE_ID),
  );
  // Feedback config is loaded once from localStorage. There is no feedback UI
  // yet (ui-web's SettingsPanel covers transition + notifications), so it stays
  // a stable read-only value rather than mutable state.
  const feedbackConfig = useMemo<FeedbackConfig>(
    () => loadPersisted<FeedbackConfig>(LS_FEEDBACK, defaultFeedbackConfig()),
    [],
  );

  const frozenIso = useDevClock((s) => s.frozenIso);
  const [now, setNow] = useState<Date>(() => new Date(nowIsoFromState(frozenIso)));

  // Feedback bus: read config live on each emit. Built once for the app lifetime.
  const feedbackBus = useMemo<FeedbackBus>(
    () =>
      createFeedbackBus(() => feedbackConfig, createDesktopFeedbackSink(), {
        prefersReducedMotion: () =>
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }),
    [feedbackConfig],
  );

  // Load the canonical Today model once on mount (single source of truth).
  useEffect(() => {
    if (!window.api?.db) return;
    let active = true;
    window.api.db
      .getTodayData()
      .then((loaded) => {
        // Reserve the id counter past persisted ids so new items/subtasks
        // created this session can't collide with ids from a previous one.
        reserveIdsFromData(loaded);
        if (active) setTodayData(loaded);
      })
      .catch((error: unknown) => {
        console.error('Failed to load today data', error);
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist lifted settings to localStorage when they change.
  useEffect(() => savePersisted(LS_TRANSITION, transitionSettings), [transitionSettings]);
  useEffect(() => savePersisted(LS_NOTIFICATIONS, notifications), [notifications]);
  useEffect(() => savePersisted(LS_FEEDBACK, feedbackConfig), [feedbackConfig]);
  useEffect(() => savePersisted(LS_TEMPLATE, templateId), [templateId]);

  // Drive `now` from the dev clock: update immediately when frozenIso changes,
  // and tick every second so a live (unfrozen) clock advances.
  useEffect(() => {
    setNow(new Date(nowIsoFromState(frozenIso)));
    const interval = setInterval(() => {
      setNow(new Date(nowIsoFromState(frozenIso)));
    }, 1000);
    return () => clearInterval(interval);
  }, [frozenIso]);

  // Single onChange: update state, persist to SQLite, and fire feedback cues.
  const handleTodayChange = (next: TodayData): void => {
    const prevCount = todayData.items.length;
    const prevDone = todayData.items.filter((i) => i.status === 'done').length;
    const nextCount = next.items.length;
    const nextDone = next.items.filter((i) => i.status === 'done').length;

    setTodayData(next);
    if (window.api?.db) {
      window.api.db.saveTodayData(next).catch((error: unknown) => {
        console.error('Failed to save today data', error);
      });
    }

    if (nextCount > prevCount) feedbackBus.emit('item.added', now);
    if (nextDone > prevDone) {
      feedbackBus.emit('item.completed', now);
      if (prevDone === 0) feedbackBus.emit('item.firstCompleted', now);
    }
  };

  const handleTransitionCapture = (text: string): void => {
    if (!window.api?.db) return;
    void window.api.db.addCapture(text).catch((error: unknown) => {
      console.error('Failed to save capture', error);
    });
  };

  useEffect(() => {
    if (!window.api?.db) return;
    void hydrateFromDb();
  }, [hydrateFromDb]);

  // Hydrate the saved appearance preference once on mount.
  useEffect(() => {
    setAppearance(loadPersisted(LS_APPEARANCE, 'system'));
  }, [setAppearance]);

  // Persist the appearance preference when it changes.
  useEffect(() => savePersisted(LS_APPEARANCE, appearance), [appearance]);

  // Apply the resolved theme to <html> for CSS custom properties.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Resolve the active theme from the appearance preference. 'system' follows
  // the OS (and live-updates on OS change); 'light'/'dark' pin it explicitly.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const resolve = () => {
      const dark = appearance === 'system' ? mq.matches : appearance === 'dark';
      setTheme(dark ? 'dark' : 'light');
    };
    resolve();
    const handler = () => {
      if (appearance === 'system') resolve();
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [appearance, setTheme]);

  // Listen for navigation events from main process (⌘K, menu)
  useEffect(() => {
    if (!window.api) return;
    const unsub = window.api.app.onNavigate((s: Screen) => {
      setSettingsOpen(false);
      setScreen(s);
    });
    return unsub;
  }, [setScreen]);

  // Keyboard: Escape returns to today / collapses details; Cmd-E expands focused item.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (e.key === 'Escape' && screen === 'capture') {
        setScreen('today');
        return;
      }
      if (e.key === 'Escape' && expandedItemId !== null) {
        expandItem(null);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e' && screen === 'today') {
        const activeElement = document.activeElement;
        if (!(activeElement instanceof HTMLElement)) return;
        const row = activeElement.closest<HTMLElement>('[data-item-id]');
        const itemId = row?.dataset.itemId;
        if (itemId === undefined) return;
        e.preventDefault();
        expandItem(itemId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expandedItemId, expandItem, screen, setScreen, settingsOpen]);

  return (
    <div className="win">
      <Titlebar>
        <AppearanceToggle value={appearance} onChange={setAppearance} />
        <button
          type="button"
          className={`titlebar__icon-btn${settingsOpen ? ' titlebar__icon-btn--on' : ''}`}
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Settings"
          aria-pressed={settingsOpen}
          title="Settings"
        >
          ⚙
        </button>
      </Titlebar>

      <div className="body">
        {settingsOpen ? (
          <SettingsScreen
            transition={transitionSettings}
            onTransitionChange={setTransitionSettings}
            notifications={notifications}
            onNotificationsChange={setNotifications}
            onBack={() => setSettingsOpen(false)}
          />
        ) : (
          <>
            {screen === 'today' && (
              <TodayBoardScreen
                data={todayData}
                now={now}
                templateId={templateId}
                onTemplateChange={setTemplateId}
                onChange={handleTodayChange}
                onNavigateCapture={() => setScreen('capture')}
              />
            )}
            {screen === 'capture' && <CaptureScreen onBack={() => setScreen('today')} />}
          </>
        )}
      </div>

      {/* Single in-window transition overlay (replaces the racing InterventionLayer). */}
      <TransitionLayer
        data={todayData}
        settings={transitionSettings}
        now={now}
        onCapture={handleTransitionCapture}
      />

      {/* Dev-only overlays — never rendered in production builds. */}
      {import.meta.env.DEV && (
        <>
          <DevClockControl />
          <BuildDiagnostics />
        </>
      )}
    </div>
  );
}
