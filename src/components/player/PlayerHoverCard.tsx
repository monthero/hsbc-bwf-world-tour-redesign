import { HoverCard, Skeleton, type PopoverProps } from '@mantine/core';
import { clsx } from 'clsx';
import { useMemo, type FC, type ReactNode } from 'react';

import { CountryLabel } from '~/components/country';
import { FollowButton } from '~/components/follow';
import { OutcomeBadge, ScoreChips, TeamLabel } from '~/components/match';
import { Eyebrow, IconButton, IconProfile } from '~/components/ui';
import { PlayerHoverContext } from '~/contexts';
import { useIsMobile } from '~/hooks/useIsMobile';
import { usePlayerProfile } from '~/hooks/useSeason';
import type { PlayerMatch } from '~/types';
import { byMatchTime, opposite, roundName } from '~/utils/matches';
import { outcomeLabel } from '~/utils/season';

import { BioStat, FactTile } from './BioFacts';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerName } from './PlayerName';
import { RankCard } from './Rank';
import { SeedTag } from './SeedTag';

import classes from './PlayerHoverCard.module.css';
import utils from '~/styles/utils.module.css';

const byTime = (a: PlayerMatch, b: PlayerMatch) => byMatchTime(a.match, b.match);

const EDGE = 30;

const MIDDLEWARES: PopoverProps['middlewares'] = {
  flip: { fallbackStrategy: 'bestFit', padding: EDGE },
  shift: { padding: EDGE },
  size: {
    padding: EDGE,
    apply: ({ availableHeight, elements }) => {
      elements.floating.style.maxHeight = `${availableHeight}px`;
    },
  },
};

export const PlayerHoverCard: FC<{ id: string; children: ReactNode }> = ({ id, children }) => {
  const isMobile = useIsMobile();
  if (isMobile) return children;
  return (
    <HoverCard
      openDelay={300}
      closeDelay={160}
      width={360}
      position="bottom-start"
      offset={6}
      middlewares={MIDDLEWARES}
      withinPortal
    >
      <HoverCard.Target>
        <span className={classes.target}>{children}</span>
      </HoverCard.Target>
      <HoverCard.Dropdown className={clsx(utils.popover, classes.dropdown)}>
        <PlayerHoverContext value={null}>
          <PlayerCard id={id} />
        </PlayerHoverContext>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};

const PlayerCard: FC<{ id: string }> = ({ id }) => {
  const { status, player, record, bio, ranks, seed, matches, week } = usePlayerProfile(id);
  const runs = useMemo(() => matches.filter((pm) => pm.tournament.status === 'live').sort(byTime), [matches]);
  if (!player)
    return status === 'missing' ? (
      <p className={classes.empty}>No profile data for this player.</p>
    ) : (
      <div className={classes.loading}>
        <Skeleton height={60} circle />
        <Skeleton height={14} width="60%" />
      </div>
    );
  return (
    <>
      <div className={classes.header}>
        <div className={classes.actions}>
          <FollowButton players={[player]} name={player.name} variant="outline" box="md" />
          <IconButton
            label="See full profile"
            tip="See full profile"
            shape="rounded"
            link={{ to: '/players/$id', params: { id } }}
          >
            <IconProfile size={18} />
          </IconButton>
        </div>
        <PlayerAvatar player={player} photo={record?.photo} size={60} ring />
        <div className={classes.identity}>
          <PlayerName player={player} className={classes.name} />
          <span className={classes.meta}>
            {player.cc && <CountryLabel cc={player.cc} flagSize="sm" />}
            <SeedTag seed={seed} variant="pill" />
          </span>
        </div>
      </div>
      {bio.stats.length > 0 && (
        <div className={classes.stats}>
          {bio.stats.map((s) => (
            <BioStat key={s.key} item={s} size="sm" />
          ))}
        </div>
      )}
      {ranks.length > 0 && (
        <div className={classes.section}>
          <Eyebrow>BWF World Ranking · week {week.split('-')[1]}</Eyebrow>
          {ranks.map((k) => (
            <RankCard key={k.ev} rank={k} />
          ))}
        </div>
      )}
      {bio.details.length > 0 && (
        <div className={clsx(classes.section, classes.grid)}>
          {bio.details.map((f) => (
            <FactTile key={f.key} label={f.label} value={f.value} size="sm" />
          ))}
        </div>
      )}
      {bio.equipment.length > 0 && (
        <div className={classes.section}>
          <Eyebrow>Equipment</Eyebrow>
          <div className={classes.grid}>
            {bio.equipment.map((q) => (
              <FactTile key={q.key} label={q.label} value={q.value} size="sm" tone="tile" />
            ))}
          </div>
        </div>
      )}
      {bio.ambition && (
        <div className={classes.section}>
          <FactTile label="Ambition" value={`“${bio.ambition}”`} size="sm" tone="tile" />
        </div>
      )}
      {runs.length > 0 && (
        <div className={clsx(classes.section, classes.runs)}>
          <Eyebrow>This week</Eyebrow>
          {runs.map((pm) => (
            <div key={pm.key} className={clsx(utils.inset, classes.run)}>
              <OutcomeBadge outcome={pm.outcome} label={outcomeLabel(pm)} />
              <span className={classes.runText}>
                <span className={clsx(utils.ellipsis, classes.runOpp)}>
                  vs <TeamLabel players={pm.match.teams[opposite(pm.side)].players} />
                </span>
                <span className={classes.runMeta}>
                  {roundName(pm.match.round)} · {pm.match.event}
                </span>
              </span>
              <ScoreChips match={pm.match} side={pm.side} size="sm" />
            </div>
          ))}
        </div>
      )}
    </>
  );
};
