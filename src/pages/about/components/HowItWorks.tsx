import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { useMemo, type FC } from 'react';

import { SectionTitle } from '~/components/ui';
import { QUALIFY_PER_COUNTRY, QUALIFY_SPOTS, SEASON_YEAR, TOUR_CYCLES } from '~/constants';
import { useTournaments } from '~/hooks/useTournaments';
import { date, formatWall } from '~/utils/dates';
import { finalsOf, knownFinalsCity } from '~/utils/tournaments';

import { ABOUT_SECTIONS, LONG_MONTH } from '../constants';
import { tierSummaries } from '../summaries';
import { SectionLink } from './SectionLink';
import { TierLadder } from './TierLadder';

import classes from './HowItWorks.module.css';
import utils from '~/styles/utils.module.css';

const PATHWAY = TOUR_CYCLES.find((c) => SEASON_YEAR >= c.from && SEASON_YEAR <= c.to)?.super100 === 'pathway';

const CALENDAR_LINK = { to: '/calendar' } as const;

const MORE = (
  <SectionLink link={CALENDAR_LINK}>
    <Trans comment="Link from the About page’s “How the Tour works” section to the full season calendar">
      Full calendar
    </Trans>
  </SectionLink>
);

const Levels: FC<{ levels: number }> = ({ levels }) => (
  <Trans comment="About page explainer. Tournament levels are the World Tour tiers (Super 1000, 750, 500 and 300); keep “Super 1000” untranslated. Ranking points decide world rankings and qualification">
    Tournaments are graded in{' '}
    <Plural
      value={levels}
      _0="no levels"
      _1="one level"
      _2="two levels"
      _3="three levels"
      _4="four levels"
      _5="five levels"
      _6="six levels"
      other="# levels"
    />
    . The higher the level, the bigger the prize money and the more <b>World Tour ranking points</b> on offer, with the
    Super 1000 events at the top.
  </Trans>
);

const Qualify: FC<{ city: string | null; month: string | null }> = ({ city, month }) => {
  if (city && month)
    return (
      <Trans comment="About page explainer. “The race” is the Race to Finals points table; the World Tour Finals is the season-ending event, held in {city} in {month}. The five disciplines are men’s and women’s singles and doubles, and mixed doubles">
        Only the top {QUALIFY_SPOTS} in each of the five disciplines of the race qualify for the{' '}
        <b>World Tour Finals</b> in {city} in {month}, with a maximum of {QUALIFY_PER_COUNTRY} per country.
      </Trans>
    );
  if (month)
    return (
      <Trans comment="About page explainer. “The race” is the Race to Finals points table; the World Tour Finals is the season-ending event, held in {month} (host city not announced yet). The five disciplines are men’s and women’s singles and doubles, and mixed doubles">
        Only the top {QUALIFY_SPOTS} in each of the five disciplines of the race qualify for the{' '}
        <b>World Tour Finals</b> in {month}, with a maximum of {QUALIFY_PER_COUNTRY} per country.
      </Trans>
    );
  return (
    <Trans comment="About page explainer. “The race” is the Race to Finals points table; the World Tour Finals is the season-ending event. The five disciplines are men’s and women’s singles and doubles, and mixed doubles">
      Only the top {QUALIFY_SPOTS} in each of the five disciplines of the race qualify for the <b>World Tour Finals</b>,
      with a maximum of {QUALIFY_PER_COUNTRY} per country.
    </Trans>
  );
};

export const HowItWorks: FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useLingui();
  const { data } = useTournaments(SEASON_YEAR);
  const tiers = useMemo(() => (data ? tierSummaries(data) : undefined), [data]);
  const finals = useMemo(() => finalsOf(data), [data]);
  const levels = tiers?.filter((t) => t.level !== 'Finals').length ?? 4;
  const city = knownFinalsCity(finals);
  const month = finals ? formatWall(date(finals.start), LONG_MONTH) : null;
  const title = i18n._(ABOUT_SECTIONS.tiers);
  return (
    <section className={className} aria-label={title}>
      <SectionTitle aside={MORE}>{title}</SectionTitle>
      <div className={classes.how}>
        <div className={classes.prose}>
          <p>
            <Levels levels={levels} />
          </p>
          {PATHWAY && (
            <p className={classes.extra}>
              <Trans comment="About page explainer. The BWF Tour Super 100 is the level below the World Tour; keep the name untranslated">
                The <b>BWF Tour Super 100</b> also awards ranking points. It isn’t part of the World Tour, but it is the
                pathway most players take to get there.
              </Trans>
            </p>
          )}
          <p className={classes.callout}>
            <span className={clsx(utils.figure, classes.figure)}>{QUALIFY_SPOTS}</span>
            <span>
              <Qualify city={city} month={month} />
            </span>
          </p>
        </div>
        {tiers ? <TierLadder tiers={tiers} pathway={PATHWAY} /> : <Skeleton className={classes.skeleton} radius={16} />}
      </div>
    </section>
  );
};
