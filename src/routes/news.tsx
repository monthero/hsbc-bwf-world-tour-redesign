import { createFileRoute } from '@tanstack/react-router';

import { NewsPage } from '~/pages/news/NewsPage';
import { NewsSearch } from '~/pages/news/types';

export const Route = createFileRoute('/news')({
  validateSearch: NewsSearch,
  component: NewsPage,
});
