import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.layer.css';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { DirectionProvider, MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { PageError, PageNotFound } from './components/layout';
import { activateLocale } from './i18n/activate';
import { isLocale, localeDir, localeInPath, SOURCE_LOCALE, stripLocale, withLocale } from './i18n/locales';
import { routeTree } from './routeTree.gen';
import { useLocaleStore } from './stores/locale';
import { settingsColorSchemeManager } from './stores/settings';
import { cssVariablesResolver, theme } from './theme';

const queryClient = new QueryClient();
const colorSchemeManager = settingsColorSchemeManager();

const activeLocale = () => (isLocale(i18n.locale) ? i18n.locale : SOURCE_LOCALE);

const router = createRouter({
  routeTree,
  rewrite: {
    input: ({ url }) => {
      url.pathname = stripLocale(url.pathname);
      return url;
    },
    output: ({ url }) => {
      url.pathname = withLocale(url.pathname, activeLocale());
      return url;
    },
  },
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultNotFoundComponent: PageNotFound,
  defaultErrorComponent: PageError,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const initialLocale = () => {
  const fromPath = localeInPath(location.pathname);
  if (fromPath) useLocaleStore.getState().choose(fromPath);
  return fromPath ?? useLocaleStore.getState().chosen ?? SOURCE_LOCALE;
};

const boot = async () => {
  const locale = initialLocale();
  const pathname = withLocale(location.pathname, locale);
  if (pathname !== location.pathname)
    history.replaceState(history.state, '', pathname + location.search + location.hash);
  await activateLocale(locale);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <DirectionProvider initialDirection={localeDir(locale)} detectDirection={false}>
          <MantineProvider
            theme={theme}
            cssVariablesResolver={cssVariablesResolver}
            defaultColorScheme="auto"
            colorSchemeManager={colorSchemeManager}
          >
            <DatesProvider settings={{ firstDayOfWeek: 1, consistentWeeks: true }}>
              <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
              </QueryClientProvider>
            </DatesProvider>
          </MantineProvider>
        </DirectionProvider>
      </I18nProvider>
    </StrictMode>,
  );
};

void boot();
