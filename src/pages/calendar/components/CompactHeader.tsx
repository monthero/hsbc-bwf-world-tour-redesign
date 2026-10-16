import { Plural, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { SeasonSummary, Tournament } from '~/types';

import { SeasonBar } from './SeasonBar';
import { SeasonHeading } from './SeasonHeading';
import { StopsDone } from './StopsDone';

import classes from './CompactHeader.module.css';
import utils from '~/styles/utils.module.css';

export const CompactHeader = memo<{
  visible: boolean;
  tournaments: Tournament[];
  season: SeasonSummary;
  isMobile: boolean;
}>(({ visible, tournaments, season, isMobile }) => {
  const { t } = useLingui();
  const { done, total, liveCount } = season;
  return (
    <header
      className={clsx(utils.glass, classes.header)}
      data-visible={visible || undefined}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className={clsx(utils.container, classes.inner)}>
        <div className={classes.summary}>
          <span className={classes.title}>
            <SeasonHeading season={season} />
          </span>
          <span className={classes.meta}>
            {season.phase !== 'current' && `${season.year} · `}
            <StopsDone done={done} total={total} className={classes.done} />
            {liveCount > 0 && (
              <>
                {' · '}
                <span className={classes.live}>
                  <Plural
                    value={liveCount}
                    one="# live"
                    other="# live"
                    comment="Compact calendar header: number of tournaments being played right now"
                  />
                </span>
              </>
            )}
          </span>
        </div>
        <SeasonBar
          tournaments={tournaments}
          size="sm"
          isMobile={isMobile}
          label={t({
            message: 'Season stops',
            comment:
              'Screen-reader label for the strip of dots, one per tournament of the season, in the calendar header',
          })}
          className={classes.cells}
        />
      </div>
    </header>
  );
});
