import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useCallback } from 'react';

import { NewsCard, StorySkeleton, SubscribeCard } from '~/components/news';
import { SectionTitle } from '~/components/ui';
import type { NewsStory } from '~/utils/news';

import { LATEST_COUNT, SECTION } from '../constants';
import type { RegisterSection } from '../types';
import { LeadStory } from './LeadStory';

import classes from './LatestSection.module.css';
import utils from '~/styles/utils.module.css';

const SLOTS = Array.from({ length: LATEST_COUNT - 1 }, (_, i) => i);

export const LatestSection = memo<{
  stories: NewsStory[] | undefined;
  isMobile: boolean;
  register: RegisterSection;
}>(({ stories, isMobile, register }) => {
  const ref = useCallback((el: HTMLElement | null) => register(SECTION.latest, el), [register]);
  const [lead, ...rest] = stories ?? [];
  const variant = isMobile ? 'row' : 'list';
  return (
    <section ref={ref} className={classes.section}>
      <SectionTitle className={classes.heading}>
        <Trans comment="News page: heading of, and jump chip to, the newest stories section">Latest</Trans>
      </SectionTitle>
      <div className={classes.grid}>
        <LeadStory story={lead} isMobile={isMobile} />
        <div className={classes.side}>
          <ol className={clsx(!isMobile && utils.card, classes.list)}>
            {stories
              ? rest.map((s) => (
                  <li key={s.item.id} className={classes.item}>
                    <NewsCard story={s} variant={variant} />
                  </li>
                ))
              : SLOTS.map((i) => (
                  <li key={i} className={classes.item}>
                    <StorySkeleton variant={variant} />
                  </li>
                ))}
          </ol>
          {!isMobile && <SubscribeCard />}
        </div>
      </div>
    </section>
  );
});
