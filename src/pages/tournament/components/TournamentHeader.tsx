import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type FC, type ReactNode } from 'react';

import { LogoTile, TournamentHoverCard, TournamentPlace, TournamentStatusBadge } from '~/components/tournament';
import { BackPill, IconBack, IconButton, IconCoins, IconNext, MediaCover } from '~/components/ui';
import { LEVEL_META, LEVEL_VARS } from '~/constants';
import type { Tournament, TournamentSchedule } from '~/types';
import { tournamentParams } from '~/utils/tournaments';

import { PRIZE_MONEY } from '../constants';
import { useCalendarBack } from '../hooks';
import { DayTimeline } from './DayTimeline';
import { IconLabel } from './IconLabel';

import classes from './TournamentHeader.module.css';
import utils from '~/styles/utils.module.css';

const RoundButton: FC<{
  from: Tournament;
  target: Tournament | undefined;
  dir: 'prev' | 'next';
  edge: string;
  children: ReactNode;
}> = ({ from, target, dir, edge, children }) => {
  const { t } = useLingui();
  const other = !!target && target.year !== from.year;
  const name = other ? target.heading : (target?.title ?? '');
  const prev = dir === 'prev';
  let label = edge;
  let kicker: string;
  if (prev) {
    if (target)
      label = t({ message: `Previous: ${name}`, comment: 'Button to the previous tournament. {name} is its name' });
    kicker = other
      ? t({ message: 'Previous season', comment: 'Hover card kicker: the linked tournament is in the previous season' })
      : t({ message: 'Previous event', comment: 'Hover card kicker: the linked tournament is the one before this' });
  } else {
    if (target) label = t({ message: `Next: ${name}`, comment: 'Button to the next tournament. {name} is its name' });
    kicker = other
      ? t({ message: 'Next season', comment: 'Hover card kicker: the linked tournament is in the next season' })
      : t({ message: 'Next event', comment: 'Hover card kicker: the linked tournament is the one after this' });
  }
  return (
    <TournamentHoverCard tournament={target} kicker={kicker}>
      <IconButton
        label={label}
        tip={target ? undefined : label}
        disabled={!target}
        link={target && { to: '/world-tour/$year/$slug', params: tournamentParams(target) }}
      >
        {children}
      </IconButton>
    </TournamentHoverCard>
  );
};

export const TournamentHeader = memo<{
  tournament: Tournament;
  prev: Tournament | undefined;
  next: Tournament | undefined;
  schedule: TournamentSchedule | undefined;
}>(({ tournament: tn, prev, next, schedule }) => {
  const { t } = useLingui();
  const back = useCalendarBack(tn.year);
  return (
    <header className={clsx(utils.container, classes.header)} style={LEVEL_VARS[tn.level]}>
      <div className={classes.top}>
        <BackPill link={back.link}>{back.label}</BackPill>
        <nav
          className={classes.rounds}
          aria-label={t({
            message: 'Other tournaments',
            comment: 'Accessible name of the previous and next tournament buttons',
          })}
        >
          <RoundButton
            from={tn}
            target={prev}
            dir="prev"
            edge={t({
              message: 'First event on record',
              comment: 'Tooltip on the disabled previous-tournament button: there is no earlier tournament',
            })}
          >
            <IconBack size={16} />
          </RoundButton>
          <RoundButton
            from={tn}
            target={next}
            dir="next"
            edge={t({
              message: 'Last event of the season',
              comment: 'Tooltip on the disabled next-tournament button: there is no later tournament',
            })}
          >
            <IconNext size={16} />
          </RoundButton>
        </nav>
      </div>
      <div className={classes.stage}>
        <MediaCover src={tn.header} position="center 40%" fade="none" muted={tn.cancelled} className={classes.banner}>
          {tn.cancelled && <TournamentStatusBadge tournament={tn} variant="overlay" className={classes.cancelled} />}
        </MediaCover>
        <div className={classes.body}>
          <LogoTile src={tn.logo} size="var(--logo)" alt={tn.name} flat className={classes.logo} />
          <div className={classes.text}>
            <h1 className={classes.title}>
              {tn.heading} {tn.subtitle && <span className={classes.subtitle}>{tn.subtitle}</span>}
            </h1>
            <div className={classes.meta}>
              <span className={classes.dates}>{tn.dates}</span>
              <TournamentPlace tournament={tn} />
              {tn.venue && <span className={classes.venue}>{tn.venue}</span>}
              <span className={classes.chip}>
                <b className={classes.level}>
                  {LEVEL_META[tn.level].long}
                  {tn.level !== 'Finals' && <span className={classes.series}>World Tour</span>}
                </b>
                <IconLabel icon={IconCoins} label={PRIZE_MONEY} size={13} className={classes.prize}>
                  <strong>{tn.prizeLabel}</strong>
                </IconLabel>
              </span>
            </div>
          </div>
        </div>
      </div>
      {schedule && <DayTimeline tournament={tn} schedule={schedule} />}
    </header>
  );
});
