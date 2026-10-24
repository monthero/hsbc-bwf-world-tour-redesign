import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { Fragment, memo, type FC, type ReactNode } from 'react';

import { Flag, type FlagSize } from '~/components/country';
import { PlayerName } from '~/components/player/PlayerName';
import { SeedTag } from '~/components/player/RankMarks';
import type { Player } from '~/types';

import { TBD } from './labels';

import classes from './TeamPlayers.module.css';
import utils from '~/styles/utils.module.css';

const Wrap: FC<{ when?: boolean; className?: string; children: ReactNode }> = ({ when, className, children }) =>
  when ? <span className={className}>{children}</span> : children;

export const TeamPlayers = memo<{
  players: readonly Player[];
  seed?: number | null;
  flag?: FlagSize | false;
  link?: boolean | ((p: Player) => boolean);
  layout?: 'stack' | 'inline';
  align?: 'start' | 'end';
  truncate?: boolean;
  wrap?: boolean;
  empty?: ReactNode;
  before?: (p: Player, i: number) => ReactNode;
  after?: (p: Player, i: number) => ReactNode;
  mark?: (p: Player, i: number) => ReactNode;
  aside?: ReactNode;
  end?: ReactNode;
  badge?: ReactNode;
  className?: string;
  nameClassName?: string;
}>(
  ({
    players,
    seed,
    flag = 'sm',
    link = true,
    layout = 'stack',
    align = 'start',
    truncate,
    wrap,
    empty,
    before,
    after,
    mark,
    aside,
    end,
    badge,
    className,
    nameClassName,
  }) => {
    const { i18n } = useLingui();
    const pairSeed = !badge && !!seed && layout === 'stack' && players.length > 1;
    const blank = empty === undefined ? i18n._(TBD) : empty;
    return (
      <span
        className={clsx(classes.team, className)}
        data-layout={layout}
        data-align={align}
        data-truncate={truncate || undefined}
        data-wrap={wrap || undefined}
        data-pair-seed={pairSeed || !!badge || undefined}
        data-pair={players.length > 1 || undefined}
        data-slots={!!(aside || end) || undefined}
        data-marks={!!mark || undefined}
      >
        {players.length
          ? players.map((p, i) => {
              const trail = (
                <>
                  {i === 0 && !pairSeed && !badge && <SeedTag seed={seed} />}
                  {after?.(p, i)}
                </>
              );
              return (
                <Fragment key={p.id || p.name}>
                  <span className={classes.player}>
                    {before?.(p, i)}
                    {flag && (
                      <Wrap when={wrap} className={classes.flagLine}>
                        <Flag cc={p.cc} size={flag} />
                      </Wrap>
                    )}
                    <Wrap when={wrap} className={classes.nameLine}>
                      <PlayerName
                        player={p}
                        link={typeof link === 'function' ? link(p) : link}
                        fit={!wrap}
                        end={wrap ? undefined : trail}
                        className={clsx(classes.name, nameClassName)}
                      />
                      {wrap && trail}
                    </Wrap>
                  </span>
                  {mark && <span className={classes.mark}>{mark(p, i)}</span>}
                </Fragment>
              );
            })
          : blank && <span className={classes.player}>{blank}</span>}
        {pairSeed && <SeedTag seed={seed} className={classes.pairSeed} />}
        {badge && <span className={classes.badge}>{badge}</span>}
        {aside && <span className={classes.aside}>{aside}</span>}
        {end && <span className={classes.end}>{end}</span>}
      </span>
    );
  },
);

export const TeamLabel = memo<{
  players: readonly Player[];
  sep?: ' / ' | ' & ';
  link?: boolean;
  fit?: boolean;
  className?: string;
}>(({ players, sep = ' / ', link = true, fit, className }) => {
  const short = players.length > 1;
  const { i18n } = useLingui();
  return (
    <span className={clsx(utils.ltr, className)}>
      {players.length
        ? players.map((p, i) => (
            <Fragment key={p.id || p.name}>
              {i > 0 && sep}
              <PlayerName player={p} link={link} short={short} fit={fit && !short} />
            </Fragment>
          ))
        : i18n._(TBD)}
    </span>
  );
});
