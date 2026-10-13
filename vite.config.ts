import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import Icons from 'unplugin-icons/vite';
import { defineConfig, loadEnv } from 'vite';

import { adminApi } from './server/admin.ts';
import { bwfProxy } from './server/bwf-proxy.ts';
import { vitePlugin } from './server/endpoints.ts';
import { newsEndpoint } from './server/news-api.ts';
import { youtubeEndpoint } from './server/youtube-api.ts';

const root = import.meta.dirname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  return {
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      Icons({ compiler: 'jsx', jsx: 'react', scale: 1 }),
      vitePlugin(bwfProxy({ relayUrl: env.BWF_RELAY_URL, relayKey: env.BWF_RELAY_KEY })),
      vitePlugin(youtubeEndpoint({ key: env.YOUTUBE_API_KEY, root, persist: true })),
      vitePlugin(newsEndpoint(root)),
      adminApi(root),
    ],
    resolve: { tsconfigPaths: true },
  };
});
