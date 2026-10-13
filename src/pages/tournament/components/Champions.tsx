import { clsx } from 'clsx';
import { memo, useMemo, type FC } from 'react';

import { EventTag, TeamPlayers } from '~/components/match';
import { PlayerAvatar } from '~/components/player';
import { IconTrophy, SectionTitle } from '~/components/ui';
import type { Player, TournamentSchedule } from '~/types';

import { buildChampions, type ChampionItem } from '../utils';

import page from '../TournamentPage.module.css';
import classes from './Champions.module.css';
import utils from '~/styles/utils.module.css';

const PHOTO_CROP = 420;

export const ChampionPhotos = memo<{ players: readonly Player[]; photos?: readonly (string | null)[] }>(
  ({ players, photos }) => (
    <>
      <div className={classes.photos}>
        {players.map((p, i) => (
          <PlayerAvatar key={p.id} player={p} photo={photos?.[i]} crop={PHOTO_CROP} link className={classes.photo} />
        ))}
      </div>
      {players.length > 1 && <span className={classes.divider} />}
      <span className={classes.scrim} />
    </>
  ),
);

const ChampionCard = memo<{ item: ChampionItem; past?: boolean }>(({ item, past }) => {
  const { event, players, photos, score } = item;
  return (
    <div className={classes.card} data-past={past || undefined}>
      <ChampionPhotos players={players} photos={photos} />
      <span className={classes.event}>
        <EventTag event={event} />
      </span>
      <div className={classes.names}>
        <TeamPlayers players={players} nameClassName={classes.name} />
        {score && <span className={classes.score}>{score}</span>}
      </div>
    </div>
  );
});

export const ChampionStrip: FC<{ items: ChampionItem[]; past?: boolean }> = ({ items, past }) => {
  return (
    <div className={page.eventGridWrap}>
      <div
        className={clsx(utils.snapRow, utils.noScrollbar, page.eventGrid, classes.strip)}
        data-past={past || undefined}
      >
        {items.map((c) => (
          <ChampionCard key={c.event} item={c} past={past} />
        ))}
      </div>
    </div>
  );
};

export const Champions = memo<{ schedule: TournamentSchedule }>(({ schedule }) => {
  const items = useMemo(() => buildChampions(schedule), [schedule]);
  if (!items.length) return null;
  return (
    <section className={clsx(utils.container, classes.section)}>
      <SectionTitle icon={<IconTrophy size={16} className={classes.trophy} />}>Champions</SectionTitle>
      <ChampionStrip items={items} />
    </section>
  );
});
