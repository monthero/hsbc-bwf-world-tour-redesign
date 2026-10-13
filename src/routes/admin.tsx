import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

import { AdminSearch } from '~/pages/admin/types';
import { devOnly } from '~/utils/dev';

export const Route = createFileRoute('/admin')({
  validateSearch: AdminSearch,
  beforeLoad: devOnly,
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('~/pages/admin/AdminPage'), 'AdminPage')
    : () => null,
});
