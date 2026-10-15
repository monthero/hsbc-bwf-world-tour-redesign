import { Skeleton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import RankingIcon from '~icons/ph/ranking';

import { CountryLabel } from '~/components/country';
import { PlayerFollow } from '~/components/follow';
import {
  FactLabel,
  FactTip,
  Partner,
  PlayerAvatar,
  PlayerName,
  RaceQualifier,
  RankChange,
  RetiredBadge,
} from '~/components/player';
import { CardHit, Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { usePlayerPhoto } from '~/hooks/usePlayers';
import type { BioView, EventCode, Focus, Player, RankView, Retirement, StatItem } from '~/types';
import { formatRank, plural } from '~/utils/format';
import { heroVars, playerHeroUrl } from '~/utils/images';

import type { CareerHigh, CareerView } from '../types';
import { finalsOf, winRate, yearRange } from '../utils';

import classes from './Hero.module.css';
import shared from './shared.module.css';
import discipline from '~/styles/discipline.module.css';
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
const KEEP_SELECTION = 'a, button, input, [data-rank]';
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
    const heroRef = useRef<HTMLElement>(null);
    useEffect(() => {
      const el = heroRef.current;
      if (!el || !switchable || !event) return;
      const onClick = (e: globalThis.MouseEvent) => {
        if (e.target instanceof Element && !e.target.closest(KEEP_SELECTION)) switchable(undefined);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') switchable(undefined);
      };
      el.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
      return () => {
        el.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKey);
      };
    }, [switchable, event]);
    return (
      <section
        ref={heroRef}
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
          <PlayerFollow player={player} variant="pill" />
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
            data-single={ranked.length === 1 || undefined}
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
  <FactTip id={s.key} label={s.label} note={s.sub}>
    <div className={classes.vital}>
      <dt className={clsx(shared.label, classes.key)}>
        <FactLabel id={s.key} label={s.label} size={16} />
      </dt>
      <dd className={classes.vitalValue}>
        {s.value}
        {s.unit && <span className={classes.unit}>{s.unit}</span>}
        {s.inline && <span className={classes.unit}>{s.inline}</span>}
      </dd>
    </div>
  </FactTip>
));

const WEEKS_AT_BEST_TIP =
  'Total weeks spent at this ranking. They don’t have to be in a row: it can add up over several spells.';

const MiniStat = memo<{ label: string; sub?: string; subTip?: string; children: ReactNode }>(
  ({ label, sub, subTip, children }) => (
    <div className={classes.mini}>
      <dt>{label}</dt>
      <dd>
        {children}
        {sub &&
          (subTip ? (
            <Tip label={subTip}>
              <span className={classes.miniSub}>{sub}</span>
            </Tip>
          ) : (
            <span className={classes.miniSub}>{sub}</span>
          ))}
      </dd>
    </div>
  ),
);

const RankTile = memo<{
  rank: RankView;
  high: CareerHigh | undefined;
  active: boolean;
  onEvent?: (event: EventCode | undefined) => void;
}>(({ rank: k, high, active, onEvent }) => {
  const pick = useCallback(() => onEvent?.(active ? undefined : k.ev), [onEvent, active, k.ev]);
  return (
    <div
      className={clsx(classes.rank, discipline.tone)}
      data-event={k.ev}
      data-rank
      data-active={active || undefined}
      data-switch={onEvent ? true : undefined}
    >
      {onEvent && <CardHit label={active ? 'Show all disciplines' : `Focus on ${EVENT_NAMES[k.ev]}`} onClick={pick} />}
      <span className={classes.rankHead}>
        <span className={classes.rankEvent}>{EVENT_NAMES[k.ev]}</span>
        <Tip label="World ranking">
          <span className={classes.rankKind}>
            <RankingIcon aria-label="World ranking" />
          </span>
        </Tip>
      </span>
      <span className={classes.rankPartner}>{k.partner && <Partner player={k.partner} />}</span>
      <span className={classes.rankLine}>
        <span className={clsx(utils.figure, classes.rankNum)}>
          {k.rank ? (
            <>
              <span className={classes.rankHash}>#</span>
              {k.rank}
            </>
          ) : (
            formatRank(k.rank)
          )}
        </span>
        {k.change ? <RankChange value={k.change} /> : null}
      </span>
      <dl className={classes.minis}>
        <MiniStat label="Race">
          {formatRank(k.race?.rank)}
          {k.race && <RaceQualifier rank={k} long />}
        </MiniStat>
        <MiniStat
          label="Career best"
          sub={high?.weeks ? `for ${plural(high.weeks, 'week')}` : undefined}
          subTip={high?.weeks && high.weeks > 1 ? WEEKS_AT_BEST_TIP : undefined}
        >
          {formatRank(high?.rank)}
        </MiniStat>
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
