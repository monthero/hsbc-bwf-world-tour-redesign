import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Menu } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, type FC } from 'react';

import { IconCheck, IconExpand, LiveDot, Tip } from '~/components/ui';
import { useSeasons } from '~/hooks/useTournaments';
import type { SeasonSummary, Tournament } from '~/types';

import { PROVISIONAL_TIP } from '../constants';
import { heroSubtitle } from '../utils';
import { SeasonBar } from './SeasonBar';
import { SeasonHeading } from './SeasonHeading';
import { StopsDone } from './StopsDone';

import classes from './Hero.module.css';
import utils from '~/styles/utils.module.css';

const MENU_CLASSES = { dropdown: clsx(utils.popover, classes.yearMenu), item: classes.yearItem };

const YearItem = memo<{ year: number; active: boolean; onYear: (year: number) => void }>(({ year, active, onYear }) => {
  const onClick = useCallback(() => onYear(year), [onYear, year]);
  return (
    <Menu.Item
      data-active={active || undefined}
      rightSection={active ? <IconCheck size={13} /> : null}
      onClick={onClick}
    >
      {year}
    </Menu.Item>
  );
});

const YearMenu: FC<{ year: number; onYear: (year: number) => void }> = ({ year, onYear }) => {
  const { data } = useSeasons();
  const { t } = useLingui();
  return (
    <Menu position="bottom-start" offset={6} classNames={MENU_CLASSES}>
      <Menu.Target>
        <button
          type="button"
          className={classes.yearButton}
          aria-label={t({
            message: `Season ${year}`,
            comment: 'Screen-reader label for the calendar’s season picker button, showing the selected year',
          })}
        >
          {year}
          <IconExpand size={13} />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {(data?.seasons ?? []).map((s) => (
          <YearItem key={s.year} year={s.year} active={s.year === year} onYear={onYear} />
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

const LiveCount: FC<{ count: number; isMobile: boolean }> = ({ count, isMobile }) =>
  isMobile ? (
    <Plural
      value={count}
      one="# live"
      other="# live"
      comment="Calendar header on phones: number of tournaments being played right now"
    />
  ) : (
    <Plural
      value={count}
      one="# live now"
      other="# live now"
      comment="Calendar header: number of tournaments being played right now"
    />
  );

const HeroStats: FC<{ season: SeasonSummary; isMobile: boolean }> = ({ season, isMobile }) => {
  const { done, total, liveCount, cancelled } = season;
  if (season.phase === 'future')
    return (
      <span>
        <Trans comment="Calendar header for a season that hasn’t started: number of tournaments (“stops”) scheduled">
          <span className={classes.count}>{total}</span>{' '}
          <Plural value={total} one="stop planned" other="stops planned" />
        </Trans>
      </span>
    );
  return (
    <>
      <span>
        <StopsDone done={done} total={total} className={classes.count} />
      </span>
      {liveCount > 0 && (
        <span className={classes.live}>
          <LiveDot pulse size={isMobile ? 6 : 7} />
          <LiveCount count={liveCount} isMobile={isMobile} />
        </span>
      )}
      {cancelled > 0 && (
        <span>
          <Plural
            value={cancelled}
            one="# cancelled"
            other="# cancelled"
            comment="Calendar header: number of this season’s tournaments that were cancelled"
          />
        </span>
      )}
    </>
  );
};

export const Hero = memo<{
  tournaments: Tournament[];
  season: SeasonSummary;
  isMobile: boolean;
  onYear: (year: number) => void;
}>(({ tournaments, season, isMobile, onYear }) => {
  const { i18n } = useLingui();
  const finals = season.finals;
  return (
    <section className={clsx(utils.container, classes.hero)}>
      <div>
        <div className={classes.kicker}>
          HSBC BWF World Tour
          <YearMenu year={season.year} onYear={onYear} />
          {season.phase === 'future' && (
            <Tip label={i18n._(PROVISIONAL_TIP)}>
              <span className={classes.provisional}>
                <Trans comment="Tag next to a future season’s year in the calendar header: the schedule is not final yet and may change">
                  Provisional
                </Trans>
              </span>
            </Tip>
          )}
        </div>
        <h1 className={classes.title}>
          <SeasonHeading season={season} />
        </h1>
        {finals && <p className={classes.subtitle}>{i18n._(heroSubtitle(finals, season.phase, isMobile))}</p>}
      </div>
      <div className={classes.progress}>
        <div className={classes.stats}>
          <HeroStats season={season} isMobile={isMobile} />
        </div>
        <SeasonBar tournaments={tournaments} size="md" isMobile={isMobile} />
      </div>
    </section>
  );
});
