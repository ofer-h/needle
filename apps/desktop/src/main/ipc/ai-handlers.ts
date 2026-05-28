import { ipcMain } from 'electron';
import { classify } from '../ai/classify';
import { getApiKeySource, hasApiKey, saveApiKey } from '../ai/config';
import { needleLog } from '../log';

export function registerAiHandlers(): void {
  ipcMain.handle('ai:classify', async (_event, payload: { text: string }) => {
    if (!payload || typeof payload.text !== 'string') {
      needleLog('ipc', 'ai:classify invalid payload');
      return { error: 'Invalid classify request' };
    }
    return classify(payload.text);
  });

  ipcMain.handle('ai:setApiKey', async (_event, payload: { apiKey: string }) => {
    if (!payload || typeof payload.apiKey !== 'string') {
      needleLog('ipc', 'ai:setApiKey invalid payload');
      return { error: 'Invalid API key payload' };
    }
    needleLog('ipc', 'ai:setApiKey', { keyLen: payload.apiKey.length });
    const result = saveApiKey(payload.apiKey);
    needleLog('ipc', 'ai:setApiKey done', { ok: 'ok' in result });
    return result;
  });

  ipcMain.handle('ai:hasApiKey', async () => {
    const configured = hasApiKey();
    needleLog('ipc', 'ai:hasApiKey', { configured, source: getApiKeySource() });
    return configured;
  });
}
