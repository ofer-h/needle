import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/primitives.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import TorchWindow from './components/Intervention/TorchWindow';
import CaptureWindow from './components/Intervention/CaptureWindow';
import HeroBannerWindow from './components/Intervention/HeroBannerWindow';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

if (mode === 'torch') document.body.classList.add('torch-mode');
if (mode === 'capture') document.body.classList.add('capture-mode');
if (mode === 'hero-banner') document.body.classList.add('hero-banner-mode');

const tree =
  mode === 'torch'
    ? <TorchWindow />
    : mode === 'capture'
      ? <CaptureWindow />
      : mode === 'hero-banner'
        ? <HeroBannerWindow />
        : <App />;

createRoot(rootEl).render(<StrictMode>{tree}</StrictMode>);
