import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type CSSProperties } from 'react';

import { Eyebrow, IconTimer, SectionTitle, Segmented } from '~/components/ui';
import { FIRST_SEASON } from '~/constants';
import { useLazyOptions, type LazyOption } from '~/i18n/useLazyOptions';
import type { Match, Tournament } from '~/types';
import { formatNumber, joinDots } from '~/utils/format';
import { gameWon } from '~/utils/matches';

import { FormStrip, OutcomeBadge } from '../Outcome';
import { CompareLine } from './CompareLine';
import { SideNames } from './SideNames';
import { useMatchInsights } from './useMatchInsights';
import { shareOf, type Meeting } from './utils';

import classes from './MatchDetail.module.css';
import utils from '~/styles/utils.module.css';

type Scope = 'season' | 'all';

const SCOPES: readonly LazyOption<Scope>[] = [
  {
    value: 'season',
    label: msg({ message: 'This season', comment: 'Head-to-head toggle: only meetings this season' }),
  },
  {
    value: 'all',
    label: msg({ message: 'All time', comment: 'Head-to-head toggle: every World Tour meeting since 2018' }),
  },
];

const MAX_MEETINGS = 6;

const MEETINGS_SINCE = msg({
  message:
    '{total, plural, one {# meeting on the World Tour since {FIRST_SEASON}} other {# meetings on the World Tour since {FIRST_SEASON}}}',
  comment: 'Head-to-head summary; {FIRST_SEASON} is the first season with data, e.g. 2018',
});

const MEETINGS_THIS_SEASON = msg({
  message: '{n, plural, one {# meeting this season} other {# meetings this season}}',
  comment: 'Head-to-head summary',
});

const MeetingCard = memo<{ meet: Meeting }>(({ meet: x }) => {
  return (
    <div className={classes.meet}>
      <div className={classes.meetHead}>
        <span className={classes.meetTour}>{x.tour}</span>
        <span className={clsx(utils.num, classes.meetStage)}>{x.stage}</span>
      </div>
      <div className={classes.meetBody}>
        <OutcomeBadge outcome={x.won ? 'W' : 'L'} variant="pill" />
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
        <OutcomeBadge outcome={x.won ? 'L' : 'W'} variant="pill" className={classes.resultEnd} />
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

export const HeadToHead = memo<{ match: Match; tournament: Tournament; className?: string }>(
  ({ match, tournament, className }) => {
    const [scope, setScope] = useState<Scope>('season');
    const onScope = useCallback((v: Scope | null) => v && setScope(v), []);
    const { record, history, allMeets, compare } = useMatchInsights(match, tournament);
    const { t, i18n } = useLingui();
    const scopes = useLazyOptions(SCOPES);
    const all = scope === 'all';

    const summary = useMemo(() => {
      if (all) {
        if (!record) return { a: null, b: null, share: 50, pts: '', text: t`Loading World Tour history…` };
        const total = record.a + record.b;
        const pa = formatNumber(record.pa);
        const pb = formatNumber(record.pb);
        return {
          a: record.a,
          b: record.b,
          share: shareOf(record.a, record.b),
          pts: total
            ? t({
                message: `Points ${pa} – ${pb}`,
                comment: 'Head-to-head: total points won by each side across all meetings',
              })
            : '',
          text: total ? i18n._({ ...MEETINGS_SINCE, values: { total, FIRST_SEASON } }) : t`First World Tour meeting`,
        };
      }
      const n = history.meets.length;
      const w = history.meets.filter((x) => x.won).length;
      let text = t`Loading season…`;
      if (history.ready) text = n ? i18n._({ ...MEETINGS_THIS_SEASON, values: { n } }) : t`First meeting this season`;
      return { a: w, b: n - w, share: shareOf(w, n - w), pts: '', text };
    }, [all, record, history.meets, history.ready, t, i18n]);

    const meets = (all ? allMeets : history.meets).slice(0, MAX_MEETINGS);
    const { a: winsA, b: winsB } = summary;
    const aLead = winsA !== null && winsB !== null && winsA > winsB;
    const bLead = winsA !== null && winsB !== null && winsB > winsA;
    const hasForm = history.formA.length > 0 || history.formB.length > 0;

    return (
      <section className={className}>
        <SectionTitle
          as="h3"
          aside={<Segmented className={classes.scope} options={scopes} value={scope} onChange={onScope} height={26} />}
        >
          <Trans comment="Match detail section comparing the two sides’ records against each other">Head-to-head</Trans>
        </SectionTitle>
        <SideNames teams={match.teams} className={classes.stickyNames} />
        <div className={classes.winsBlock}>
          <div className={classes.wins}>
            <span className={clsx(utils.num, classes.winsNum)} data-lead={aLead || undefined}>
              {winsA ?? '–'}
            </span>
            <span className={classes.cmpLabel}>
              <Trans comment="Head-to-head: number of wins each side has against the other">Wins</Trans>
            </span>
            <span className={clsx(utils.num, classes.winsNum)} data-lead={bLead || undefined}>
              {winsB ?? '–'}
            </span>
          </div>
          <div className={classes.hhBar}>
            <span style={{ '--w': `${Math.round(summary.share)}%` } as CSSProperties} />
            <span />
          </div>
          <span className={clsx(utils.num, classes.foot)}>{joinDots([summary.text, summary.pts])}</span>
        </div>
        <div className={classes.cmp}>
          {compare.map((r) => (
            <CompareLine key={r.key} label={i18n._(r.label)} a={r.a} b={r.b} aBetter={r.aBetter} bBetter={r.bBetter} />
          ))}
          {hasForm && (
            <CompareLine
              label={t({
                message: 'Form',
                comment: 'Head-to-head row: each side’s results in their last five matches',
              })}
              a={<FormStrip items={history.formA} variant="dot" />}
              b={<FormStrip items={history.formB} variant="dot" align="end" />}
            />
          )}
        </div>
        {meets.length > 0 && (
          <div className={classes.meets}>
            <Eyebrow>{all ? <Trans>All meetings</Trans> : <Trans>Meetings this season</Trans>}</Eyebrow>
            {meets.map((x) => (
              <MeetingCard key={x.key} meet={x} />
            ))}
          </div>
        )}
      </section>
    );
  },
);
