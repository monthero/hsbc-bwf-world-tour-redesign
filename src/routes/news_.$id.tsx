import { createFileRoute } from '@tanstack/react-router';

import { ArticlePage } from '~/pages/news-article/ArticlePage';

export const Route = createFileRoute('/news_/$id')({
  component: ArticlePage,
});
