import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/primitives.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import TorchWindow from './components/Intervention/TorchWindow';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const params = new URLSearchParams(window.location.search);
const isTorchMode = params.get('mode') === 'torch';

if (isTorchMode) {
  document.body.classList.add('torch-mode');
}

createRoot(rootEl).render(
  <StrictMode>{isTorchMode ? <TorchWindow /> : <App />}</StrictMode>,
);
