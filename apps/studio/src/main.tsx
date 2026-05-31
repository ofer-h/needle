import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@needle/ui-web/styles';
import './studio.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('No #root element');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
