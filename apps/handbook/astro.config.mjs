import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('astro').AstroUserConfig} */
export default defineConfig({
  site: 'https://needle.local',
  output: 'static',
  integrations: [mdx()],
  vite: {
    server: {
      fs: {
        allow: [path.resolve(__dirname, '../..')],
      },
    },
  },
});
