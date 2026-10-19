import { lingui } from '@lingui/vite-plugin';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import Icons from 'unplugin-icons/vite';
import { defineConfig, loadEnv, lazyPlugins } from 'vite-plus';

import { adminApi } from './server/admin.ts';
import { bwfProxy } from './server/bwf-proxy.ts';
import { vitePlugin } from './server/endpoints.ts';
import { newsEndpoint } from './server/news-api.ts';
import { youtubeEndpoint } from './server/youtube-api.ts';

const root = import.meta.dirname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  return {
    staged: {
      '*': 'vp check --fix',
    },
    fmt: {
      printWidth: 120,
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      sortImports: {},
      ignorePatterns: [
        '.claude/**',
        'data/**',
        'public/data/**',
        'public/assets/world-*.json',
        'src/routeTree.gen.ts',
        'pnpm-lock.yaml',
      ],
    },
    lint: {
      plugins: ['react', 'typescript', 'unicorn', 'oxc', 'import', 'jsx-a11y'],
      categories: {
        correctness: 'error',
        suspicious: 'warn',
      },
      options: {
        typeAware: true,
        typeCheck: true,
      },
      rules: {
        'react/rules-of-hooks': 'error',
        'react/exhaustive-deps': 'warn',
        'react/only-export-components': [
          'warn',
          {
            allowConstantExport: true,
          },
        ],
        'react/react-in-jsx-scope': 'off',
        'import/no-unassigned-import': [
          'warn',
          {
            allow: ['**/*.css'],
          },
        ],
        'typescript/require-array-sort-compare': [
          'error',
          {
            ignoreStringArrays: false,
          },
        ],
        'unicorn/prefer-at': 'error',
        'eslint/no-nested-ternary': 'error',
        'unicorn/prefer-number-properties': 'error',
        'unicorn/no-array-sort': 'off',
        'unicorn/no-array-reverse': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/prefer-add-event-listener': 'off',
        'unicorn/require-post-message-target-origin': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/no-unnecessary-type-assertion': 'off',
        'typescript/consistent-return': 'off',
        'vite-plus/prefer-vite-plus-imports': 'error',
      },
      overrides: [
        {
          files: ['src/routes/**'],
          rules: {
            'react/only-export-components': 'off',
          },
        },
        {
          files: ['src/hooks/useWindowList.ts'],
          rules: {
            'react/incompatible-library': 'off',
          },
        },
      ],
      ignorePatterns: ['data/**', 'public/**', 'dist/**', 'src/routeTree.gen.ts'],
      jsPlugins: [
        {
          name: 'vite-plus',
          specifier: 'vite-plus/oxlint-plugin',
        },
      ],
    },
    plugins: lazyPlugins(() => [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      lingui({ macroTransform: true }),
      Icons({
        compiler: 'jsx',
        jsx: 'react',
        scale: 1,
        customCollections: { bwf: FileSystemIconLoader(`${root}/src/assets/icons`) },
      }),
      vitePlugin(bwfProxy),
      vitePlugin(youtubeEndpoint({ key: env.YOUTUBE_API_KEY, root, persist: true })),
      vitePlugin(newsEndpoint(root)),
      adminApi(root),
    ]),
    resolve: { tsconfigPaths: true },
  };
});
