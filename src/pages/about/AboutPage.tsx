import { Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { useMemo, type FC } from 'react';

import { PageHeader } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { useTournaments } from '~/hooks/useTournaments';
import { ABOUT_PAGE_META } from '~/utils/meta';
import { knownFinalsCity } from '~/utils/tournaments';

import { HowItWorks } from './components/HowItWorks';
import { RaceTop8 } from './components/RaceTop8';
import { SeasonCard } from './components/SeasonCard';
import { SeasonFrame } from './components/SeasonFrame';
import { SeasonStats } from './components/SeasonStats';
import { Spotlight } from './components/Spotlight';
import { ABOUT_KICKER, ABOUT_META, ABOUT_TITLE } from './constants';
import { crownedFinals, seasonFocus, seasonLede, seasonStats } from './utils';

import classes from './AboutPage.module.css';
import utils from '~/styles/utils.module.css';

const STATS_SKELETON = <Skeleton className={classes.stats} radius={16} />;

const SEASON_SKELETON = (
  <SeasonFrame year={SEASON_YEAR} className={classes.season}>
    <Skeleton className={classes.map} radius={12} />
    <Skeleton className={classes.strip} radius={8} />
  </SeasonFrame>
);

export const AboutPage: FC = () => {
  useDocumentMeta(ABOUT_PAGE_META);
  const { i18n } = useLingui();
  const { data } = useTournaments(SEASON_YEAR);
  const focus = useMemo(() => (data ? seasonFocus(data) : undefined), [data]);
  const stats = useMemo(() => (data && focus ? seasonStats(data, focus) : undefined), [data, focus]);
  const lede = useMemo(() => i18n._(data ? seasonLede(data) : ABOUT_META), [i18n, data]);
  const city = focus && !crownedFinals(focus) ? knownFinalsCity(focus.finals) : null;
  const title = city ? (
    <Trans comment="About page heading during the season: the journey towards {city}, host city of the season-ending World Tour Finals">
      The road to <span className={classes.city}>{city}</span>
    </Trans>
  ) : (
    ABOUT_TITLE
  );
  return (
    <div className={classes.page}>
      <PageHeader
        kicker={i18n._(ABOUT_KICKER)}
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
