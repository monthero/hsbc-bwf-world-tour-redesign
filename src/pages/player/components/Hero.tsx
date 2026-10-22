import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
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
import { DARK_SCOPE } from '~/theme';
import type { BioView, EventCode, Focus, Player, RankView, Retirement, StatItem } from '~/types';
import { formatRank, formatRecord } from '~/utils/format';
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
  mobile?: boolean;
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
  ({ player, hero, focus, retired, bio, ranks, highs, career, ready, mobile, event, onEvent }) => {
    const viewportMobile = useIsMobile();
    const isMobile = mobile ?? viewportMobile;
    const hasPhoto = !!usePlayerPhoto(player.id).src;
    const style = useMemo(
      () => ({ ...DARK_SCOPE, ...(hero && heroVars(playerHeroUrl(player.id, hero, isMobile, !!focus), focus)) }),
      [player.id, hero, isMobile, focus],
    );
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
        data-mantine-color-scheme="dark"
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

const WEEKS_AT_BEST = msg({
  message: '{weeks, plural, one {for # week} other {for # weeks}}',
  comment: 'Under the career-best ranking: how many weeks the player held it',
});

const WEEKS_AT_BEST_TIP = msg({
  message: 'Total weeks spent at this ranking. They don’t have to be in a row: it can add up over several spells.',
  comment: 'Tooltip on “for N weeks” under the player’s career-best world ranking',
});

const MiniStat = memo<{ label: ReactNode; sub?: string; subTip?: string; children: ReactNode }>(
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
  const { t, i18n } = useLingui();
  const pick = useCallback(() => onEvent?.(active ? undefined : k.ev), [onEvent, active, k.ev]);
  const eventName = EVENT_NAMES[k.ev];
  const weeks = high?.weeks;
  const focus = active
    ? t({ message: 'Show all disciplines', comment: 'Action on a selected ranking tile: stop filtering by discipline' })
    : t({
        message: `Focus on ${eventName}`,
        comment: 'Action on a ranking tile: filter the profile to one discipline',
      });
  const ranking = t({
    message: 'World ranking',
    comment: 'Icon label on a ranking tile: the number is the BWF world ranking',
  });
  return (
    <div
      className={clsx(classes.rank, discipline.tone)}
      data-event={k.ev}
      data-rank
      data-active={active || undefined}
      data-switch={onEvent ? true : undefined}
    >
      {onEvent && <CardHit label={focus} onClick={pick} />}
      <span className={classes.rankHead}>
        <span className={classes.rankEvent}>{eventName}</span>
        <Tip label={ranking}>
          <span className={classes.rankKind}>
            <RankingIcon aria-label={ranking} />
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
        <MiniStat
          label={
            <Trans
              context="ranking"
              comment="Short label: the player’s position in the Race to Finals, the season standings that decide who qualifies for the World Tour Finals"
            >
              Race
            </Trans>
          }
        >
          {formatRank(k.race?.rank)}
          {k.race && <RaceQualifier rank={k} long />}
        </MiniStat>
        <MiniStat
          label={
            <Trans comment="Short label: the player’s highest ever world ranking in this discipline">Career best</Trans>
          }
          sub={weeks ? i18n._({ ...WEEKS_AT_BEST, values: { weeks } }) : undefined}
          subTip={weeks && weeks > 1 ? i18n._(WEEKS_AT_BEST_TIP) : undefined}
        >
          {formatRank(high?.rank)}
        </MiniStat>
      </dl>
    </div>
  );
});

const StatBar = memo<{ career: CareerView; prize: string; ready: boolean }>(({ career, prize, ready }) => {
  const { t } = useLingui();
  const cells = useMemo((): Cell[] => {
    const first = career.seasons.at(-1)?.year;
    const last = career.seasons[0]?.year;
    const list: Cell[] = [];
    if (first && last)
      list.push(
        {
          key: 'titles',
          label: t({ message: 'Titles', comment: 'Career stat: number of tournaments won' }),
          value: career.counts.gold,
        },
        {
          key: 'finals',
          label: t({
            message: 'Finals',
            context: 'stat',
            comment: 'Career stat: number of tournament finals reached, won or lost',
          }),
          value: finalsOf(career),
        },
        {
          key: 'rate',
          label: t({ message: 'Win rate', comment: 'Stat label: share of matches won, as a percentage' }),
          value: winRate(career.wins, career.losses),
          sub: formatRecord(career.wins, career.losses),
        },
        {
          key: 'seasons',
          label: t({ message: 'Seasons', comment: 'Career stat: number of World Tour seasons played' }),
          value: career.seasons.length,
          sub: yearRange(first, last),
        },
      );
    if (prize)
      list.push({
        key: 'prize',
        label: t({ message: 'Prize money', comment: 'Career stat: total prize money earned' }),
        value: prize,
      });
    return list;
  }, [career, prize, t]);
  if (ready && !cells.length) return null;
  return (
    <dl className={classes.stats}>
      <span className={clsx(shared.label, classes.statsLabel)}>
        <Trans comment="Heading of the player’s career stats bar">Career</Trans>
      </span>
      {!ready &&
        STAT_SKELETON.map((i) => <Skeleton key={i} height={58} radius={10} className={classes.statSkeleton} />)}
      {ready &&
        cells.map((c) => (
          <div key={c.key} className={classes.stat} data-key={c.key}>
            <dt className={shared.label}>{c.label}</dt>
            <dd className={clsx(utils.figure, classes.statValue)}>{c.value}</dd>
            {c.sub && <dd className={classes.statSub}>{c.sub}</dd>}
          </div>
        ))}
    </dl>
  );
});
