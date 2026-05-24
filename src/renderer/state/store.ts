import { create } from 'zustand';
import type { Screen, Theme } from '../../shared/types';

type AppState = {
  screen: Screen;
  theme: Theme;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: Theme) => void;
};

export const useAppStore = create<AppState>((set) => ({
  screen: 'today',
  theme: 'light',
  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
}));
