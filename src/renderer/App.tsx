import { useEffect } from 'react';
import { useAppStore } from './state/store';
import TodayScreen from './components/Today/TodayScreen';
import CaptureScreen from './components/Capture/CaptureScreen';
import type { Screen } from '../shared/types';

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const setScreen = useAppStore((s) => s.setScreen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  // Apply theme to <html> for CSS custom properties
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Detect system theme and listen for changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark: boolean) => setTheme(dark ? 'dark' : 'light');
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setTheme]);

  // Listen for navigation events from main process (⌘K, menu)
  useEffect(() => {
    if (!window.api) return;
    const unsub = window.api.app.onNavigate((s: Screen) => setScreen(s));
    return unsub;
  }, [setScreen]);

  // Keyboard: Escape returns to today
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screen === 'capture') setScreen('today');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, setScreen]);

  return (
    <>
      {screen === 'today' && (
        <TodayScreen active onNavigateCapture={() => setScreen('capture')} />
      )}
      {screen === 'capture' && (
        <CaptureScreen onBack={() => setScreen('today')} />
      )}
    </>
  );
}
