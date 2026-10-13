import { memo } from 'react';

import { NewsGrid } from '~/components/news';
import { SectionTitle } from '~/components/ui';
import type { NewsStory } from '~/utils/news';

import classes from './RelatedSection.module.css';

export const RelatedSection = memo<{
  title: string;
  stories: readonly NewsStory[] | undefined;
  isMobile: boolean;
}>(({ title, stories, isMobile }) => (
  <section className={classes.section}>
    <SectionTitle className={classes.title}>{title}</SectionTitle>
    <NewsGrid stories={stories} variant={isMobile ? 'row' : 'card'} skeletons={isMobile ? 3 : 4} />
  </section>
));
