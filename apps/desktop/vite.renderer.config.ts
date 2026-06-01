import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Workspace packages are edited live during development. Pre-bundling them
    // makes Vite serve a cached copy, so source edits (and newly-added exports)
    // are silently ignored until the dep cache is busted — which manifests as a
    // blank renderer when a fresh import references a name the stale bundle
    // lacks. Excluding them keeps them served as source, with working HMR.
    exclude: ['@needle/ui-web', '@needle/domain', '@needle/contract'],
  },
});
