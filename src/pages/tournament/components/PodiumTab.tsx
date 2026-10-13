import { Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo, type FC } from 'react';

import { Flag } from '~/components/country';
import { TeamPlayers, TimedStatus } from '~/components/match';
import { AvatarGroup, SeedTag } from '~/components/player';
import { Medal } from '~/components/tournament';
import { SectionTitle } from '~/components/ui';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import type { EventCode, PlayerDirectory, Team } from '~/types';
import { formatRank } from '~/utils/format';
import { playerPhoto } from '~/utils/players';
import { worldRank } from '~/utils/rankings';

import type { TabProps } from '../types';
import { buildPodium, type PodiumEvent, type PodiumPlace, type SeedEntry } from '../utils';
import { ChampionPhotos } from './Champions';

import page from '../TournamentPage.module.css';
import classes from './PodiumTab.module.css';
import utils from '~/styles/utils.module.css';

const LINE_AVATAR = 32;

const LINE_CROP = 96;

const MISSING_TIP = 'Withdrew, or their matches are missing from this data';

const RANK_TIP = 'Current BWF World Ranking in this category';

interface PlaceProps {
  place: PodiumPlace;
  event: EventCode;
  dir: PlayerDirectory | undefined;
}

const WorldRank: FC<{ team: Team; event: EventCode; dir: PlayerDirectory | undefined }> = ({ team, event, dir }) => {
  const rank = worldRank(dir, team.players, event);
  if (!rank) return null;
  return (
    <Tooltip label={RANK_TIP}>
      <span className={classes.rank}>
        World rank <b>{formatRank(rank)}</b>
      </span>
    </Tooltip>
  );
};

const PlaceMedal: FC<{ place: PodiumPlace; size: number }> = ({ place: p, size }) => {
  return (
    <Tooltip label={p.label}>
      <span className={classes.medal}>
        <Medal kind={p.medal} size={size} />
      </span>
    </Tooltip>
  );
};

const ChampionBlock: FC<PlaceProps> = ({ place: p, event, dir }) => {
  const team = p.teams?.[0];
  const countries = team ? [...new Set(team.players.map((pl) => pl.cc))] : [];
  const photos = !!team?.players.some((pl) => playerPhoto(dir, pl.id).src);
  return (
    <div className={classes.hero} data-decided={team ? true : undefined} data-photos={photos || undefined}>
      {photos && team && <ChampionPhotos players={team.players} />}
      <div className={classes.heroTop}>
        <span className={classes.heroLabel}>
          <Medal kind={p.medal} size={18} />
          {p.label}
        </span>
        <span className={classes.heroPrize}>{p.prize}</span>
      </div>
      {team ? (
        <>
          <div className={classes.heroWho}>
            <span className={classes.heroFlags}>
              {countries.map((cc) => (
                <Flag key={cc} cc={cc} size="xl" />
              ))}
            </span>
            <TeamPlayers
              players={team.players}
              seed={team.seed}
              flag={false}
              wrap
              className={classes.heroNames}
              nameClassName={classes.heroName}
            />
          </div>
          <WorldRank team={team} event={event} dir={dir} />
        </>
      ) : (
        <span className={classes.tbd}>To be decided</span>
      )}
    </div>
  );
};

const PlaceList: FC<PlaceProps> = ({ place: p, event, dir }) => {
  return (
    <div className={classes.list} data-medal={p.medal}>
      {p.teams ? (
        p.teams.map((team) => (
          <div key={team.key} className={classes.line}>
            <PlaceMedal place={p} size={16} />
            <AvatarGroup players={team.players} size={LINE_AVATAR} crop={LINE_CROP} className={classes.lineAvatars} />
            <div className={classes.lineWho}>
              <TeamPlayers players={team.players} seed={team.seed} wrap nameClassName={classes.lineName} />
              <WorldRank team={team} event={event} dir={dir} />
            </div>
            <span className={classes.linePrize}>{p.prize}</span>
          </div>
        ))
      ) : (
        <div className={classes.line}>
          <PlaceMedal place={p} size={16} />
          <span className={classes.tbd}>To be decided</span>
          <span className={classes.linePrize}>{p.prize}</span>
        </div>
      )}
    </div>
  );
};

const SeedRow: FC<{ entry: SeedEntry }> = ({ entry: s }) => {
  return (
    <div className={classes.seed} data-tone={s.team ? s.tone : 'missing'}>
      <SeedTag seed={s.seed} className={classes.seedNum} />
      {s.team ? (
        <>
          <TeamPlayers players={s.team.players} truncate className={classes.seedPlayers} />
          <Tooltip label={s.tip} disabled={!s.tip}>
            <span className={classes.status} data-tip={s.tip ? true : undefined}>
              <TimedStatus match={s.match} tone={s.tone} label={s.status} />
            </span>
          </Tooltip>
        </>
      ) : (
        <Tooltip label={MISSING_TIP}>
          <span className={classes.missing}>Not in the data</span>
        </Tooltip>
      )}
    </div>
  );
};

const CardHead: FC<{ name: string; note: string }> = ({ name, note }) => {
  return (
    <div className={classes.head}>
      <span className={classes.name}>{name}</span>
      <span className={classes.note}>{note}</span>
    </div>
  );
};

const MedalCard = memo<{ data: PodiumEvent; dir: PlayerDirectory | undefined }>(({ data: e, dir }) => {
  const [champion, ...rest] = e.places;
  return (
    <div className={clsx(utils.card, classes.card, classes.medalCard)}>
      <CardHead name={e.name} note={e.when} />
      {champion && <ChampionBlock place={champion} event={e.event} dir={dir} />}
      {rest.map((p) => (
        <PlaceList key={p.label} place={p} event={e.event} dir={dir} />
      ))}
    </div>
  );
});

const SeedCard = memo<{ data: PodiumEvent; hasMatches: boolean }>(({ data: e, hasMatches }) => {
  return (
    <div className={clsx(utils.card, classes.card)}>
      <CardHead name={e.name} note={e.seedsNote} />
      <div className={classes.seeds}>
        {e.seeds.map((s) => (
          <SeedRow key={s.key} entry={s} />
        ))}
        {!e.seeds.length && (
          <div className={classes.noSeeds}>
            {hasMatches ? 'Not in today’s data' : 'Seeds appear once the draw is out'}
          </div>
        )}
      </div>
    </div>
  );
});

export const PodiumTab: FC<TabProps> = ({ tournament, schedule }) => {
  const events = useMemo(() => buildPodium(tournament, schedule), [tournament, schedule]);
  const hasMatches = schedule.matches.length > 0;
  const { data: dir } = usePlayerDirectory();
  return (
    <div className={clsx(utils.container, page.tabSection, classes.tab)}>
      <section className={classes.section}>
        <SectionTitle>Medalists</SectionTitle>
        <div className={page.eventGridWrap}>
          <div className={page.eventGrid}>
            {events.map((e) => (
              <MedalCard key={e.event} data={e} dir={dir} />
            ))}
          </div>
        </div>
      </section>
      <section className={classes.section}>
        <SectionTitle>How the seeds did</SectionTitle>
        <div className={page.eventGridWrap}>
          <div className={page.eventGrid}>
            {events.map((e) => (
              <SeedCard key={e.event} data={e} hasMatches={hasMatches} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
