import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

import { devOnly } from '~/utils/dev';

export const Route = createFileRoute('/study-cases/')({
  beforeLoad: devOnly,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('~/pages/study-cases/StudyCasesPage'), 'StudyCasesPage')
    : () => null,
});
