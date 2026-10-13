import { createFileRoute, lazyRouteComponent, notFound } from '@tanstack/react-router';

import { AdminSearch } from '~/pages/admin/types';

export const Route = createFileRoute('/admin')({
  validateSearch: AdminSearch,
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: import.meta.env.DEV
    ? lazyRouteComponent(() => import('~/pages/admin/AdminPage'), 'AdminPage')
    : () => null,
});
