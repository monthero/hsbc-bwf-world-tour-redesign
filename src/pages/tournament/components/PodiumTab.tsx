import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useMemo, type FC } from 'react';

import { TeamPlayers, TimedStatus } from '~/components/match';
import { AvatarGroup, SeedTag } from '~/components/player';
import { Medal } from '~/components/tournament';
import { SectionTitle, Tip } from '~/components/ui';
import { usePlayerDirectory } from '~/hooks/usePlayers';
import { DARK_SCOPE_PROPS } from '~/theme';
import type { EventCode, PlayerDirectory } from '~/types';
import { playerPhoto } from '~/utils/players';

import type { TabProps } from '../types';
import { buildPodium, type PodiumEvent, type PodiumPlace, type SeedEntry } from '../utils';
import { ChampionPhotos } from './Champions';

import page from '../TournamentPage.module.css';
import classes from './PodiumTab.module.css';
import utils from '~/styles/utils.module.css';

const LINE_AVATAR = 32;

const LINE_CROP = 96;

const LINE_MEDAL = 18;

const MISSING_TIP = msg({
  message: 'Withdrew, or their matches are missing from this data',
  comment: 'Tooltip on a seed with no matches in the How the seeds did card',
});

const TBD = (
  <Trans comment="Podium place whose winner isn’t known yet because the match hasn’t been played">To be decided</Trans>
);

interface PlaceProps {
  place: PodiumPlace;
  event: EventCode;
  dir: PlayerDirectory | undefined;
}

const PlaceMedal: FC<{ place: PodiumPlace; size: number }> = ({ place: p, size }) => {
  return (
    <Tip label={p.label}>
      <span className={classes.medal}>
        <Medal kind={p.medal} size={size} trophy />
      </span>
    </Tip>
  );
};

const ChampionBlock: FC<PlaceProps> = ({ place: p, event, dir }) => {
  const team = p.teams?.[0];
  const photos = !!team?.players.some((pl) => playerPhoto(dir, pl.id).src);
  return (
    <div
      className={classes.hero}
      data-decided={team ? true : undefined}
      data-photos={photos || undefined}
      data-pair={(team && team.players.length > 1) || undefined}
      {...(photos ? DARK_SCOPE_PROPS : undefined)}
    >
      {photos && team && <ChampionPhotos players={team.players} />}
      <div className={classes.heroTop}>
        <span className={classes.heroLabel}>
          <Medal kind={p.medal} size={18} trophy />
          {p.label}
        </span>
        <span className={classes.heroPrize}>{p.prize}</span>
      </div>
      {team ? (
        <div className={classes.heroWho}>
          <TeamPlayers
            players={team.players}
            seed={team.seed}
            event={event}
            truncate
            className={classes.heroNames}
            nameClassName={classes.heroName}
          />
        </div>
      ) : (
        <span className={classes.tbd}>{TBD}</span>
      )}
    </div>
  );
};

const PlaceList: FC<PlaceProps> = ({ place: p, event }) => {
  return (
    <div className={classes.list} data-medal={p.medal}>
      {p.teams ? (
        p.teams.map((team) => (
          <div key={team.key} className={classes.line}>
            <span className={classes.lineFace}>
              <PlaceMedal place={p} size={LINE_MEDAL} />
              <AvatarGroup players={team.players} size={LINE_AVATAR} crop={LINE_CROP} className={classes.lineAvatars} />
            </span>
            <span className={classes.linePrize}>{p.prize}</span>
            <div className={classes.lineWho}>
              <TeamPlayers
                players={team.players}
                seed={team.seed}
                event={event}
                truncate
                nameClassName={classes.lineName}
              />
            </div>
          </div>
        ))
      ) : (
        <div className={classes.line}>
          <span className={classes.lineFace}>
            <PlaceMedal place={p} size={LINE_MEDAL} />
            <span className={classes.tbd}>{TBD}</span>
          </span>
          <span className={classes.linePrize}>{p.prize}</span>
        </div>
      )}
    </div>
  );
};

const SeedRow: FC<{ entry: SeedEntry }> = ({ entry: s }) => {
  const { i18n } = useLingui();
  return (
    <div className={classes.seed} data-tone={s.team ? s.tone : 'missing'}>
      <SeedTag seed={s.seed} className={classes.seedNum} />
      {s.team ? (
        <>
          <TeamPlayers players={s.team.players} truncate className={classes.seedPlayers} />
          <Tip label={s.tip} disabled={!s.tip}>
            <span className={classes.status} data-tip={s.tip ? true : undefined}>
              <TimedStatus match={s.match} tone={s.tone} label={s.status} />
            </span>
          </Tip>
        </>
      ) : (
        <Tip label={i18n._(MISSING_TIP)}>
          <span className={classes.missing}>
            <Trans comment="A seeded player or pair missing from the tournament data">Not in the data</Trans>
          </span>
        </Tip>
      )}
    </div>
  );
};

const CardHead: FC<{ data: PodiumEvent; note?: string }> = ({ data, note }) => {
  return (
    <div className={classes.head}>
      <span className={classes.name}>{data.name}</span>
      {note && <span className={classes.note}>{note}</span>}
    </div>
  );
};

const MedalCard = memo<{ data: PodiumEvent; dir: PlayerDirectory | undefined }>(({ data: e, dir }) => {
  const [champion, ...rest] = e.places;
  return (
    <div className={clsx(utils.card, classes.card, classes.medalCard)}>
      <CardHead data={e} />
      {champion && <ChampionBlock place={champion} event={e.event} dir={dir} />}
      {rest.map((p) => (
        <PlaceList key={p.medal} place={p} event={e.event} dir={dir} />
      ))}
    </div>
  );
});

const SeedCard = memo<{ data: PodiumEvent; hasMatches: boolean }>(({ data: e, hasMatches }) => {
  return (
    <div className={clsx(utils.card, classes.card)}>
      <CardHead data={e} note={e.seedsNote} />
      <div className={classes.seeds}>
        {e.seeds.map((s) => (
          <SeedRow key={s.key} entry={s} />
        ))}
        {!e.seeds.length && (
          <div className={classes.noSeeds}>
            {hasMatches ? (
              <Trans comment="How the seeds did card: none of this event’s seeds are in today’s match data">
                Not in today’s data
              </Trans>
            ) : (
              <Trans comment="How the seeds did card before the draw (bracket) is published. Seeds are the top-ranked entries, placed apart in the draw">
                Seeds appear once the draw is out
              </Trans>
            )}
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
        <SectionTitle>
          <Trans comment="Podium tab section: the champion, runner-up and semi-finalists of each event">
            Medalists
          </Trans>
        </SectionTitle>
        <div className={page.eventGridWrap}>
          <div className={clsx(page.eventGrid, classes.grid)}>
            {events.map((e) => (
              <MedalCard key={e.event} data={e} dir={dir} />
            ))}
          </div>
        </div>
      </section>
      <section className={classes.section}>
        <SectionTitle>
          <Trans comment="Podium tab section: how far each seeded (top-ranked) player or pair got in each event">
            How the seeds did
          </Trans>
        </SectionTitle>
        <div className={page.eventGridWrap}>
          <div className={clsx(page.eventGrid, classes.grid)}>
            {events.map((e) => (
              <SeedCard key={e.event} data={e} hasMatches={hasMatches} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
