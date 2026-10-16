import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'zh', 'zh-hant', 'id', 'ms', 'th', 'hi', 'es', 'da', 'ko', 'ja', 'fr', 'tl', 'vi', 'pt-br', 'ar'],
  fallbackLocales: { default: 'en' },
  format: formatter({ lineNumbers: false, customHeaderAttributes: { 'POT-Creation-Date': '' } }),
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['src'],
      exclude: ['**/node_modules/**', 'src/pages/admin/**', 'src/pages/study-cases/**'],
    },
  ],
});
