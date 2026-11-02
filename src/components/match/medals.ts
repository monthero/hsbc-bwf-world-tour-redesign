import { msg } from '@lingui/core/macro';

import { lazyRecord } from '~/i18n/lazy';
import type { Match, MedalKind, Side, SideResult } from '~/types';
import { sideResult } from '~/utils/matches';

export interface MedalStake {
  kind: MedalKind;
  text: string;
  tip: string;
}

const ROUND_MEDALS: Partial<Record<string, MedalKind>> = { F: 'gold' };

const RESULT_MEDALS: Partial<Record<string, Partial<Record<SideResult, MedalKind>>>> = {
  F: { won: 'gold', lost: 'silver' },
  SF: { lost: 'bronze' },
};

const STAKES: Partial<Record<string, string>> = lazyRecord({
  F: msg({
    message: 'Playing for gold',
    comment:
      'Short line on the live score of a tournament final: what the match decides. Keep it short, one line on a phone',
  }),
});

const STAKE_TIPS: Partial<Record<string, string>> = lazyRecord({
  F: msg({
    message: 'Playing for gold. The runner-up takes silver.',
    comment: 'What is at stake in a tournament final. World Tour events have no bronze play-off',
  }),
});

export const MEDAL_LABELS: Record<MedalKind, string> = lazyRecord({
  gold: msg({ message: 'Champion', context: 'result tag', comment: 'Result tag on the winner of a tournament final' }),
  silver: msg({ message: 'Silver medal', comment: 'Medal mark beside the side that lost a tournament final' }),
  bronze: msg({
    message: 'Bronze medal',
    comment: 'Medal mark beside a side that lost a semi-final. There is no bronze play-off, so both get bronze',
  }),
});

export const medalStake = (round: string): MedalStake | null => {
  const kind = ROUND_MEDALS[round];
  const text = STAKES[round];
  const tip = STAKE_TIPS[round];
  return kind && text && tip ? { kind, text, tip } : null;
};

export const decidesMedals = (round: string) => !!RESULT_MEDALS[round];

export const sideMedal = (m: Match, side: Side): MedalKind | null =>
  RESULT_MEDALS[m.round]?.[sideResult(m, side)] ?? null;
