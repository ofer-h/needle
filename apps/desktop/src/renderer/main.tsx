import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/primitives.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import TorchWindow from './components/Intervention/TorchWindow';
import CaptureWindow from './components/Intervention/CaptureWindow';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

if (mode === 'torch') {
  document.body.classList.add('torch-mode');
  document.documentElement.dataset.theme = 'dark';
  document.documentElement.style.background = 'transparent';
  const rootEl2 = document.getElementById('root');
  if (rootEl2) rootEl2.style.background = 'transparent';
}
if (mode === 'capture') document.body.classList.add('capture-mode');

const tree =
  mode === 'torch'
    ? <TorchWindow />
    : mode === 'capture'
      ? <CaptureWindow />
      : <App />;

createRoot(rootEl).render(<StrictMode>{tree}</StrictMode>);
