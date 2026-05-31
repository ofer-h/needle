import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** Library build (publishable-shaped) + Vitest config. Studio consumes ui-web
 * source directly via the workspace export map, so this build is for validation
 * /packaging, not for the demo to run. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
