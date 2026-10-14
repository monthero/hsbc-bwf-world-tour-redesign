import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, type ReactNode } from 'react';

import { CountryLabel } from '~/components/country';
import { PlayerFollow } from '~/components/follow';
import { Partner, PlayerAvatar, PlayerName, RaceQualifier, RankChange, RetiredBadge } from '~/components/player';
import { CardHit } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { usePlayerPhoto } from '~/hooks/usePlayers';
import type { BioView, EventCode, Focus, Player, RankView, Retirement, StatItem } from '~/types';
import { formatNumber, formatRank } from '~/utils/format';
import { heroVars, playerHeroUrl } from '~/utils/images';

import type { CareerHigh, CareerView } from '../types';
import { finalsOf, winRate, yearRange } from '../utils';

import classes from './Hero.module.css';
import shared from './shared.module.css';
import utils from '~/styles/utils.module.css';

interface HeroProps {
  player: Player;
  hero: string | null | undefined;
  focus: Focus | null | undefined;
  retired?: Retirement;
  bio: BioView;
  ranks: readonly RankView[];
  highs: ReadonlyMap<EventCode, CareerHigh>;
  career: CareerView;
  ready: boolean;
  event?: EventCode;
  onEvent?: (event: EventCode | undefined) => void;
}

interface Cell {
  key: string;
  label: string;
  value: ReactNode;
  sub?: string;
}

const RANK_LIMIT = 3;
const PORTRAIT_CROP = 520;
const STAT_SKELETON = [0, 1, 2, 3];

export const Hero = memo<HeroProps>(
  ({ player, hero, focus, retired, bio, ranks, highs, career, ready, event, onEvent }) => {
    const isMobile = useIsMobile();
    const hasPhoto = !!usePlayerPhoto(player.id).src;
    const style = hero ? heroVars(playerHeroUrl(player.id, hero, isMobile, !!focus), focus) : undefined;
    const ranked = useMemo(() => ranks.filter((k) => k.rank).slice(0, RANK_LIMIT), [ranks]);
    const pairs = ranked.some((k) => k.partner);
    const switchable = ranked.length > 1 ? onEvent : undefined;
    return (
      <section
        className={classes.hero}
        style={style}
        data-image={hero ? true : undefined}
        data-portrait={!hero && hasPhoto ? true : undefined}
      >
        {!hero && hasPhoto && (
          <span className={classes.portrait}>
            <PlayerAvatar player={player} crop={PORTRAIT_CROP} />
          </span>
        )}
        <span className={classes.follow}>
          <PlayerFollow player={player} withLabel variant="pill" />
        </span>
        <div className={classes.identity}>
          <span className={classes.tags}>
            {player.cc && (
              <span className={clsx(utils.glassTag, classes.country)}>
                <CountryLabel cc={player.cc} flagSize="md" />
              </span>
            )}
            <RetiredBadge retired={retired} size="md" />
          </span>
          <h1 className={classes.name}>
            <PlayerName
              player={player}
              link={false}
              layout="stacked"
              firstClassName={classes.part}
              lastClassName={classes.part}
            />
          </h1>
          {bio.stats.length > 0 && (
            <dl className={classes.vitals}>
              {bio.stats.map((s) => (
                <Vital key={s.key} item={s} />
              ))}
            </dl>
          )}
        </div>
        {ranked.length > 0 && (
          <div
            className={classes.ranks}
            data-picked={switchable && event ? true : undefined}
            data-pairs={pairs || undefined}
          >
            {ranked.map((k) => (
              <RankTile key={k.ev} rank={k} high={highs.get(k.ev)} active={k.ev === event} onEvent={switchable} />
            ))}
          </div>
        )}
        <StatBar career={career} prize={bio.prize} ready={ready} />
      </section>
    );
  },
);

const Vital = memo<{ item: StatItem }>(({ item: s }) => (
  <div className={classes.vital} title={s.sub}>
    <dt className={shared.label}>{s.label}</dt>
    <dd className={classes.vitalValue}>
      {s.value}
      {s.unit && <span className={classes.unit}>{s.unit}</span>}
      {s.inline && <span className={classes.unit}>{s.inline}</span>}
    </dd>
  </div>
));

const MiniStat = memo<{ label: string; children: ReactNode }>(({ label, children }) => (
  <div className={classes.mini}>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
));

const RankTile = memo<{
  rank: RankView;
  high: CareerHigh | undefined;
  active: boolean;
  onEvent?: (event: EventCode | undefined) => void;
}>(({ rank: k, high, active, onEvent }) => {
  const pick = useCallback(() => onEvent?.(active ? undefined : k.ev), [onEvent, active, k.ev]);
  return (
    <div className={classes.rank} data-active={active || undefined} data-switch={onEvent ? true : undefined}>
      {onEvent && <CardHit label={active ? 'Show all disciplines' : `Focus on ${EVENT_NAMES[k.ev]}`} onClick={pick} />}
      <span className={classes.rankHead}>
        <span className={classes.rankEvent}>{EVENT_NAMES[k.ev]}</span>
        <span className={classes.rankKind}>World ranking</span>
      </span>
      <span className={classes.rankPartner}>{k.partner && <Partner player={k.partner} label={false} />}</span>
      <span className={classes.rankLine}>
        <span className={clsx(utils.figure, classes.rankNum)}>{formatRank(k.rank)}</span>
        {k.change ? <RankChange value={k.change} /> : <span className={classes.flat}>–</span>}
      </span>
      <dl className={classes.minis}>
        <MiniStat label="Race">
          {formatRank(k.race?.rank)}
          {k.race && <RaceQualifier rank={k} />}
        </MiniStat>
        <MiniStat label="Career high">{formatRank(high?.rank)}</MiniStat>
        <MiniStat label="Weeks at high">{high?.weeks ? formatNumber(high.weeks) : '—'}</MiniStat>
      </dl>
    </div>
  );
});

const StatBar = memo<{ career: CareerView; prize: string; ready: boolean }>(({ career, prize, ready }) => {
  const cells = useMemo((): Cell[] => {
    const first = career.seasons.at(-1)?.year;
    const last = career.seasons[0]?.year;
    const list: Cell[] = [];
    if (first && last)
      list.push(
        { key: 'titles', label: 'Titles', value: career.counts.gold },
        { key: 'finals', label: 'Finals', value: finalsOf(career) },
        {
          key: 'rate',
          label: 'Win rate',
          value: winRate(career.wins, career.losses),
          sub: `${career.wins}–${career.losses}`,
        },
        { key: 'seasons', label: 'Seasons', value: career.seasons.length, sub: yearRange(first, last) },
      );
    if (prize) list.push({ key: 'prize', label: 'Prize money', value: prize });
    return list;
  }, [career, prize]);
  if (ready && !cells.length) return null;
  return (
    <dl className={classes.stats}>
      <span className={clsx(shared.label, classes.statsLabel)}>Career</span>
      {!ready &&
        STAT_SKELETON.map((i) => <Skeleton key={i} height={58} radius={10} className={classes.statSkeleton} />)}
      {ready &&
        cells.map((c) => (
          <div key={c.key} className={classes.stat}>
            <dt className={shared.label}>{c.label}</dt>
            <dd className={clsx(utils.figure, classes.statValue)}>{c.value}</dd>
            {c.sub && <dd className={classes.statSub}>{c.sub}</dd>}
          </div>
        ))}
    </dl>
  );
});
