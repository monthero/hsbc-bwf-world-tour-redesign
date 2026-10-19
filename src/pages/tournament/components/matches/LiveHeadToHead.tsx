import { useLingui } from '@lingui/react/macro';
import { memo } from 'react';

import {
  ALL_TIME,
  CompareLine,
  FORM,
  FormStrip,
  HEAD_TO_HEAD,
  THIS_SEASON,
  useMatchInsights,
} from '~/components/match';
import { Eyebrow } from '~/components/ui';
import type { Match, Tournament } from '~/types';

import classes from './LiveHeadToHead.module.css';

const WinsLine = memo<{ label: string; a: number; b: number }>(({ label, a, b }) => (
  <CompareLine label={label} a={a} b={b} aBetter={a > b} bBetter={b > a} size="sm" />
));

export const LiveHeadToHead = memo<{ match: Match; tournament: Tournament }>(({ match, tournament }) => {
  const { i18n } = useLingui();
  const { record, history, compare } = useMatchInsights(match, tournament);
  const met = history.meets.length;
  const wins = history.meets.filter((x) => x.won).length;
  const ever = record && record.a + record.b > 0 ? record : null;
  const rank = compare.find((r) => r.key === 'wr' && (r.aBetter || r.bBetter));
  const form = history.formA.length > 0 && history.formB.length > 0;
  if (!met && !ever && !rank && !form) return null;
  return (
    <section className={classes.h2h}>
      <Eyebrow className={classes.title}>{i18n._(HEAD_TO_HEAD)}</Eyebrow>
      <div className={classes.tape}>
        {met > 0 && <WinsLine label={i18n._(THIS_SEASON)} a={wins} b={met - wins} />}
        {ever && <WinsLine label={i18n._(ALL_TIME)} a={ever.a} b={ever.b} />}
        {rank && (
          <CompareLine
            label={i18n._(rank.label)}
            a={rank.a}
            b={rank.b}
            aBetter={rank.aBetter}
            bBetter={rank.bBetter}
            size="sm"
          />
        )}
        {form && (
          <CompareLine
            label={i18n._(FORM)}
            a={<FormStrip items={history.formA} variant="dot" />}
            b={<FormStrip items={history.formB} variant="dot" align="end" />}
            size="sm"
          />
        )}
      </div>
    </section>
  );
});
