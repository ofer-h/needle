import { ipcMain } from 'electron';
import { classify } from '../ai/classify';
import { hasApiKey, saveApiKey } from '../ai/config';

export function registerAiHandlers(): void {
  ipcMain.handle('ai:classify', async (_event, payload: { text: string }) => {
    if (!payload || typeof payload.text !== 'string') {
      return { error: 'Invalid classify request' };
    }
    return classify(payload.text);
  });

  ipcMain.handle('ai:setApiKey', async (_event, payload: { apiKey: string }) => {
    if (!payload || typeof payload.apiKey !== 'string') {
      return { error: 'Invalid API key payload' };
    }
    return saveApiKey(payload.apiKey);
  });

  ipcMain.handle('ai:hasApiKey', async () => {
    return hasApiKey();
  });
}
