import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { useMemo, type FC } from 'react';

import { PageHeader, SectionTitle } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import { useTournaments } from '~/hooks/useTournaments';
import { knownFinalsCity } from '~/utils/tournaments';

import { HowItWorks } from './components/HowItWorks';
import { RaceTop8 } from './components/RaceTop8';
import { SeasonCard } from './components/SeasonCard';
import { SeasonStats } from './components/SeasonStats';
import { Spotlight } from './components/Spotlight';
import { ABOUT_KICKER, ABOUT_META, ABOUT_TITLE, ROAD_TO } from './constants';
import { crownedFinals, seasonFocus, seasonLede, seasonStats } from './utils';

import classes from './AboutPage.module.css';
import utils from '~/styles/utils.module.css';

const TITLE_SITE = { season: SEASON_YEAR };

const STATS_SKELETON = <Skeleton className={classes.stats} radius={16} />;

const SEASON_SKELETON = (
  <section className={clsx(utils.card, classes.season)} aria-label={`${SEASON_YEAR} season map`}>
    <SectionTitle>{`${SEASON_YEAR} season`}</SectionTitle>
    <Skeleton className={classes.map} radius={12} />
    <Skeleton className={classes.strip} radius={8} />
  </section>
);

export const AboutPage: FC = () => {
  useDocumentTitle('About', TITLE_SITE);
  const { data } = useTournaments(SEASON_YEAR);
  const focus = useMemo(() => (data ? seasonFocus(data) : undefined), [data]);
  const stats = useMemo(() => (data && focus ? seasonStats(data, focus) : undefined), [data, focus]);
  const lede = useMemo(() => (data ? seasonLede(data) : ABOUT_META), [data]);
  const city = focus && !crownedFinals(focus) ? knownFinalsCity(focus.finals) : null;
  const title = city ? (
    <>
      {ROAD_TO} <span className={classes.city}>{city}</span>
    </>
  ) : (
    ABOUT_TITLE
  );
  return (
    <div className={classes.page}>
      <PageHeader
        kicker={ABOUT_KICKER}
        title={title}
        meta={lede}
        aside={stats ? <SeasonStats stats={stats} /> : STATS_SKELETON}
        className={classes.header}
      />
      <main className={clsx(utils.container, classes.main)}>
        {data && focus ? <SeasonCard tournaments={data} year={SEASON_YEAR} focus={focus} /> : SEASON_SKELETON}
        <Spotlight />
        <HowItWorks className={classes.section} />
        <RaceTop8 focus={focus} className={classes.section} />
      </main>
    </div>
  );
};
