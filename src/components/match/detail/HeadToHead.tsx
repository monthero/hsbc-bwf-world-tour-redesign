import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type CSSProperties, type FC } from 'react';

import { TeamFollow } from '~/components/follow';
import { AvatarGroup } from '~/components/player/PlayerAvatar';
import { Eyebrow, IconTimer, SectionTitle, Segmented, type SegmentedOption } from '~/components/ui';
import { FIRST_SEASON } from '~/constants';
import type { Match, Team, Tournament } from '~/types';
import { plural } from '~/utils/format';
import { gameWon } from '~/utils/matches';

import { FormStrip, OutcomeBadge } from '../Outcome';
import { TeamPlayers } from '../TeamPlayers';
import { useMatchInsights } from './useMatchInsights';
import type { CompareRow, Meeting } from './utils';

import classes from './MatchDetail.module.css';
import utils from '~/styles/utils.module.css';

type Scope = 'season' | 'all';
type Side = 'a' | 'b';

const SCOPES: readonly SegmentedOption<Scope>[] = [
  { value: 'season', label: 'This season' },
  { value: 'all', label: 'All time' },
];

const MAX_MEETINGS = 6;

const SideHeader: FC<{ team: Team; side: Side }> = ({ team, side }) => (
  <div className={classes.hhSide} data-side={side}>
    <AvatarGroup players={team.players} size={48} />
    <div className={classes.hhNames}>
      <TeamPlayers
        players={team.players}
        seed={team.seed}
        align={side === 'b' ? 'end' : 'start'}
        end={<TeamFollow players={team.players} variant="outline" box="sm" />}
        className={classes.hhTeam}
        nameClassName={classes.hhName}
      />
    </div>
  </div>
);

const CompareLine: FC<{ row: CompareRow }> = ({ row: r }) => (
  <div className={classes.cmpRow}>
    <span className={clsx(utils.num, classes.cmpValue)} data-better={r.aBetter || undefined}>
      {r.a}
    </span>
    <span className={classes.cmpLabel}>{r.label}</span>
    <span className={clsx(utils.num, classes.cmpValue)} data-better={r.bBetter || undefined}>
      {r.b}
    </span>
  </div>
);

const MeetingCard = memo<{ meet: Meeting }>(({ meet: x }) => {
  return (
    <div className={classes.meet}>
      <div className={classes.meetHead}>
        <span className={classes.meetTour}>{x.tour}</span>
        <span className={clsx(utils.num, classes.meetStage)}>{x.stage}</span>
      </div>
      <div className={classes.meetBody}>
        <OutcomeBadge outcome={x.won ? 'W' : 'L'} label={x.won ? 'WON' : 'LOST'} variant="pill" />
        <span className={clsx(utils.num, classes.meetGames)}>
          {x.games.map((g, i) => (
            <span key={i}>
              <span className={classes.gameScore} data-win={gameWon(g, 0) || undefined}>
                {g[0]}
              </span>
              <span className={classes.colon}>:</span>
              <span className={classes.gameScore} data-win={gameWon(g, 1) || undefined}>
                {g[1]}
              </span>
            </span>
          ))}
        </span>
        <OutcomeBadge
          outcome={x.won ? 'L' : 'W'}
          label={x.won ? 'LOST' : 'WON'}
          variant="pill"
          className={classes.resultEnd}
        />
      </div>
      {(x.venue || x.dur) && (
        <span className={classes.meetSub}>
          {x.venue}
          {x.venue && x.dur && ' · '}
          {x.dur && (
            <span className={classes.dur}>
              <IconTimer size={11} />
              {x.dur}
            </span>
          )}
        </span>
      )}
    </div>
  );
});

export const HeadToHead = memo<{ match: Match; tournament: Tournament }>(({ match, tournament }) => {
  const [scope, setScope] = useState<Scope>('season');
  const onScope = useCallback((v: Scope | null) => v && setScope(v), []);
  const { record, history, allMeets, compare } = useMatchInsights(match, tournament);
  const [tA, tB] = match.teams;
  const all = scope === 'all';

  const summary = useMemo(() => {
    if (all) {
      if (!record) return { a: null, b: null, share: 50, pts: '', text: 'Loading World Tour history…' };
      const t = record.a + record.b;
      return {
        a: record.a,
        b: record.b,
        share: t ? (record.a / t) * 100 : 50,
        pts: t ? `Points ${record.pa} – ${record.pb}` : '',
        text: t ? `${plural(t, 'meeting')} on the World Tour since ${FIRST_SEASON}` : 'First World Tour meeting',
      };
    }
    const n = history.meets.length;
    const w = history.meets.filter((x) => x.won).length;
    let text = 'Loading season…';
    if (history.ready) text = n ? `${plural(n, 'meeting')} this season` : 'First meeting this season';
    return { a: w, b: n - w, share: n ? (w / n) * 100 : 50, pts: '', text };
  }, [all, record, history.meets, history.ready]);

  const meets = (all ? allMeets : history.meets).slice(0, MAX_MEETINGS);
  const { a: winsA, b: winsB } = summary;
  const aLead = winsA !== null && winsB !== null && winsA > winsB;
  const bLead = winsA !== null && winsB !== null && winsB > winsA;
  const hasForm = history.formA.length > 0 || history.formB.length > 0;

  return (
    <div className={classes.h2h}>
      <SectionTitle
        as="h3"
        aside={<Segmented className={classes.scope} options={SCOPES} value={scope} onChange={onScope} height={26} />}
      >
        Head-to-head
      </SectionTitle>
      <div className={classes.hhHeader}>
        <SideHeader team={tA} side="a" />
        <div className={classes.hhScore}>
          <div className={clsx(utils.num, classes.wins)}>
            <span className={classes.winsNum} data-lead={aLead || undefined}>
              {winsA ?? '–'}
            </span>
            <span className={classes.winsLabel}>WINS</span>
            <span className={classes.winsNum} data-lead={bLead || undefined}>
              {winsB ?? '–'}
            </span>
          </div>
          {summary.pts && <span className={clsx(utils.num, classes.pts)}>{summary.pts}</span>}
        </div>
        <SideHeader team={tB} side="b" />
      </div>
      <div className={classes.hhBar}>
        <span style={{ '--w': `${Math.round(summary.share)}%` } as CSSProperties} />
        <span />
      </div>
      <span className={classes.hhText}>{summary.text}</span>
      <div className={classes.cmp}>
        {compare.map((r) => (
          <CompareLine key={r.key} row={r} />
        ))}
        {hasForm && (
          <div className={classes.cmpRow} data-last>
            <FormStrip items={history.formA} variant="dot" />
            <span className={classes.cmpLabel}>Form</span>
            <FormStrip items={history.formB} variant="dot" align="end" />
          </div>
        )}
      </div>
      {meets.length > 0 && (
        <div className={classes.meets}>
          <Eyebrow>{all ? 'All meetings' : 'Meetings this season'}</Eyebrow>
          {meets.map((x) => (
            <MeetingCard key={x.key} meet={x} />
          ))}
        </div>
      )}
    </div>
  );
});
