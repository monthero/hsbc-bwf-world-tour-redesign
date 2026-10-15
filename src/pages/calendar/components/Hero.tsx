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
  return (
    <Menu position="bottom-start" offset={6} classNames={MENU_CLASSES}>
      <Menu.Target>
        <button type="button" className={classes.yearButton} aria-label={`Season ${year}`}>
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

const HeroStats: FC<{ season: SeasonSummary; isMobile: boolean }> = ({ season, isMobile }) => {
  if (season.phase === 'future')
    return (
      <span>
        <span className={classes.count}>{season.total}</span> stops planned
      </span>
    );
  return (
    <>
      <span>
        <span className={classes.count}>{season.done}</span> of {season.total} stops
      </span>
      {season.liveCount > 0 && (
        <span className={classes.live}>
          <LiveDot pulse size={isMobile ? 6 : 7} />
          {season.liveCount} live{isMobile ? '' : ' now'}
        </span>
      )}
      {season.cancelled > 0 && <span>{season.cancelled} cancelled</span>}
    </>
  );
};

export const Hero = memo<{
  tournaments: Tournament[];
  season: SeasonSummary;
  isMobile: boolean;
  onYear: (year: number) => void;
}>(({ tournaments, season, isMobile, onYear }) => {
  const finals = season.finals;
  return (
    <section className={clsx(utils.container, classes.hero)}>
      <div>
        <div className={classes.kicker}>
          HSBC BWF World Tour
          <YearMenu year={season.year} onYear={onYear} />
          {season.phase === 'future' && (
            <Tip label={PROVISIONAL_TIP}>
              <span className={classes.provisional}>Provisional</span>
            </Tip>
          )}
        </div>
        <h1 className={classes.title}>
          <SeasonHeading season={season} />
        </h1>
        {finals && <p className={classes.subtitle}>{heroSubtitle(finals, season.phase, isMobile)}</p>}
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
