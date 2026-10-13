import { Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useMemo, type FC } from 'react';

import { IconNext, SectionTitle } from '~/components/ui';
import { QUALIFY_PER_COUNTRY, QUALIFY_SPOTS, SEASON_YEAR, TOUR_CYCLES } from '~/constants';
import { useTournaments } from '~/hooks/useTournaments';
import { date } from '~/utils/dates';
import { finalsOf, knownFinalsCity } from '~/utils/tournaments';

import { ABOUT_SECTIONS } from '../constants';
import { tierSummaries } from '../summaries';
import { TierLadder } from './TierLadder';

import classes from './HowItWorks.module.css';
import more from './SectionLink.module.css';
import utils from '~/styles/utils.module.css';

const TITLE = ABOUT_SECTIONS[0].title;

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];

const PATHWAY = TOUR_CYCLES.find((c) => SEASON_YEAR >= c.from && SEASON_YEAR <= c.to)?.super100 === 'pathway';

const MORE = (
  <Link to="/calendar" className={more.more}>
    Full calendar
    <IconNext size={14} />
  </Link>
);

export const HowItWorks: FC<{ className?: string }> = ({ className }) => {
  const { data } = useTournaments(SEASON_YEAR);
  const tiers = useMemo(() => (data ? tierSummaries(data) : undefined), [data]);
  const finals = useMemo(() => finalsOf(data), [data]);
  const levels = tiers?.filter((t) => t.level !== 'Finals').length ?? 4;
  const city = knownFinalsCity(finals);
  const when = finals ? ` in ${date(finals.start).format('MMMM')}` : '';
  return (
    <section className={className} aria-label={TITLE}>
      <SectionTitle aside={MORE}>{TITLE}</SectionTitle>
      <div className={classes.how}>
        <div className={classes.prose}>
          <p>
            Tournaments are graded in {NUMBER_WORDS[levels] ?? levels} levels. The higher the level, the bigger the
            prize money and the more <b>World Tour ranking points</b> on offer, with the Super 1000 events at the top.
          </p>
          {PATHWAY && (
            <p className={classes.extra}>
              The <b>BWF Tour Super 100</b> also awards ranking points. It isn’t part of the World Tour, but it is the
              pathway most players take to get there.
            </p>
          )}
          <p className={classes.callout}>
            <span className={clsx(utils.figure, classes.figure)}>{QUALIFY_SPOTS}</span>
            <span>
              Only the top {QUALIFY_SPOTS} in each of the five disciplines of the race qualify for the{' '}
              <b>World Tour Finals</b>
              {city ? ` in ${city}` : ''}
              {when}, with a maximum of {QUALIFY_PER_COUNTRY} per country.
            </span>
          </p>
        </div>
        {tiers ? <TierLadder tiers={tiers} pathway={PATHWAY} /> : <Skeleton className={classes.skeleton} radius={16} />}
      </div>
    </section>
  );
};
