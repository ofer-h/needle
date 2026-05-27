import { useEffect, useState } from 'react';
import type { AppDiagnostics } from '../../../shared/ipc-contracts';
import type { FlowHealthSnapshot } from '../../../shared/flow-health';
import { uiLog } from '../../utils/ui-log';
import './BuildDiagnostics.css';

export default function BuildDiagnostics() {
  const [diag, setDiag] = useState<AppDiagnostics | null>(null);
  const [flowHealth, setFlowHealth] = useState<FlowHealthSnapshot | null>(null);

  useEffect(() => {
    if (!window.api?.app?.getDiagnostics) return;
    void window.api.app
      .getDiagnostics()
      .then((d) => {
        setDiag(d);
        uiLog('diagnostics', 'build info', {
          version: d.version,
          gitSha: d.gitSha,
          apiKeySource: d.apiKeySource,
          envFileLoaded: d.envFileLoaded,
          envFilePath: d.envFilePath,
        });
        if (!d.isPackaged && window.api?.app?.getFlowHealth) {
          return window.api.app.getFlowHealth().then(setFlowHealth);
        }
        return undefined;
      })
      .catch((err: unknown) => {
        uiLog('diagnostics', 'failed to load', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }, []);

  if (diag === null) return null;

  const keyLabel =
    diag.apiKeySource === 'env'
      ? 'key: .env'
      : diag.apiKeySource === 'config'
        ? 'key: userData'
        : diag.envFileLoaded
          ? 'key: empty (.env)'
          : 'key: missing';

  return (
    <div className="build-diag" role="status" aria-label="Build diagnostics">
      <span className="build-diag__item">v{diag.version}</span>
      <span className="build-diag__item">{diag.gitSha}</span>
      <span
        className={`build-diag__item ${
          keyLabel === 'key: empty (.env)' ? 'build-diag__item--warn' : ''
        }`}
        title={
          keyLabel === 'key: empty (.env)'
            ? 'ANTHROPIC_API_KEY is blank in .env on disk — add your key and save the file, then restart'
            : undefined
        }
      >
        {keyLabel}
      </span>
      {diag.envFileLoaded && diag.envFilePath !== null && (
        <span className="build-diag__item build-diag__item--muted" title={diag.envFilePath}>
          .env ok
        </span>
      )}
      {!diag.envFileLoaded && !diag.isPackaged && (
        <span className="build-diag__item build-diag__item--warn">no .env</span>
      )}
      {!diag.isPackaged && flowHealth?.lastClassify !== null && flowHealth?.lastClassify !== undefined && (
        <span
          className={`build-diag__item ${
            flowHealth.lastClassify.outcome === 'error' ? 'build-diag__item--warn' : ''
          }`}
          title={flowHealth.lastClassify.error ?? flowHealth.lastClassify.bucket}
        >
          classify {flowHealth.lastClassify.outcome} {flowHealth.lastClassify.ms}ms
        </span>
      )}
    </div>
  );
}
