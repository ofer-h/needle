import { ipcMain, BrowserWindow, nativeTheme } from 'electron';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  TorchBrainDumpSubmitPayload,
  TorchClosePayload,
  TorchShowPayload,
  TorchSkipConfirmPayload,
  TorchSnoozePayload,
} from '../../shared/ipc-contracts';
import { hideCapture, showCapture } from '../windows/capture';
import {
  broadcastSnoozedToOverlays,
  enterBrainDumpMode,
  enterSkipMode,
  exitBrainDumpMode,
  exitSkipMode,
  hideTorch,
  scheduleTorchReactivation,
  setTorchDismissHandler,
  setWindowInteractive,
  showTorch,
} from '../windows/torch';

function findMainAppWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find(
    (w) =>
      !w.webContents.getURL().includes('mode=torch') &&
      !w.webContents.getURL().includes('mode=capture'),
  );
}

export function registerIpcHandlers(): void {
  // System notification click → ask main-app renderer to acknowledge the torch.
  setTorchDismissHandler((correlationId) => {
    findMainAppWindow()?.webContents.send('torch:closed', {
      correlationId,
      reason: 'acknowledged',
    });
    hideTorch();
  });

  ipcMain.handle('app:getTheme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.on('navigate', (_event, screen: string) => {
    const win = findMainAppWindow();
    if (win) win.webContents.send('navigate', screen);
  });

  // Torch
  ipcMain.on('torch:show', (_event, payload: TorchShowPayload) => {
    showTorch(payload);
  });
  ipcMain.on('torch:hide', () => {
    hideTorch();
  });
  ipcMain.on('torch:dismiss', (_event, payload: TorchClosePayload) => {
    findMainAppWindow()?.webContents.send('torch:closed', payload);
    hideTorch();
  });
  ipcMain.on('torch:snooze', (_event, payload: TorchSnoozePayload) => {
    broadcastSnoozedToOverlays(payload.snoozeMs);
    scheduleTorchReactivation(payload.snoozeMs);
  });

  ipcMain.on('torch:skip-init', () => {
    enterSkipMode();
  });

  ipcMain.on('torch:skip-confirm', (_event, payload: TorchSkipConfirmPayload) => {
    const closePayload: TorchClosePayload = {
      reason: 'skipped',
      correlationId: payload.correlationId,
      ...(payload.reason !== undefined ? { skipReason: payload.reason } : {}),
      ...(payload.notes !== undefined ? { skipNotes: payload.notes } : {}),
    };
    findMainAppWindow()?.webContents.send('torch:closed', closePayload);
    exitSkipMode();
    hideTorch();
  });

  ipcMain.on('torch:skip-cancel', () => {
    exitSkipMode();
  });

  ipcMain.on('torch:brain-dump-init', () => {
    enterBrainDumpMode();
  });

  ipcMain.on('torch:brain-dump-submit', (_event, payload: TorchBrainDumpSubmitPayload) => {
    const closePayload: TorchClosePayload = {
      reason: 'acknowledged',
      correlationId: payload.correlationId,
      brainDumpText: payload.text,
    };
    findMainAppWindow()?.webContents.send('torch:closed', closePayload);
    exitBrainDumpMode();
    hideTorch();
  });

  ipcMain.on('torch:brain-dump-cancel', () => {
    exitBrainDumpMode();
  });

  // Per-window hover-based interactivity toggle (Electron forward-event pattern).
  ipcMain.on('torch:set-interactive', (event, payload: { interactive: boolean }) => {
    setWindowInteractive(event.sender, payload.interactive);
  });

  // Capture
  ipcMain.on('capture:show', (_event, payload: CaptureShowPayload) => {
    showCapture(payload);
  });
  ipcMain.on('capture:hide', () => {
    hideCapture();
  });
  ipcMain.on('capture:add-entry', (_event, payload: CaptureEntryPayload) => {
    findMainAppWindow()?.webContents.send('capture:entry-added', payload);
  });
  ipcMain.on('capture:promote-entry', (_event, payload: CapturePromotePayload) => {
    findMainAppWindow()?.webContents.send('capture:entry-promoted', payload);
  });
  ipcMain.on('capture:dismiss-entry', (_event, payload: CapturePromotePayload) => {
    findMainAppWindow()?.webContents.send('capture:entry-dismissed', payload);
  });
  ipcMain.on('capture:close', (_event, payload: CaptureClosePayload) => {
    findMainAppWindow()?.webContents.send('capture:closed', payload);
    hideCapture();
  });
}
