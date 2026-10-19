import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import type { SideStats } from '~/api/bwf/normalize';
import { IconHand, InfoTip, Tip } from '~/components/ui';
import { CHALLENGE_RULE, CHALLENGES_PER_GAME, challengeHeadline, challengeRows, challengeTip } from '~/utils/live';

import classes from './ChallengeStocks.module.css';
import utils from '~/styles/utils.module.css';

const SLOTS = Array.from({ length: CHALLENGES_PER_GAME }, (_, i) => i);

export const ChallengeStocks = memo<{ stats: SideStats | null; left: number | null; className?: string }>(
  ({ stats, left, className }) => {
    const { i18n } = useLingui();
    if (!stats || left === null) return null;
    const card = (
      <InfoTip title={challengeHeadline(left)} subtitle={i18n._(CHALLENGE_RULE)} rows={challengeRows(stats)} inline />
    );
    return (
      <Tip label={card}>
        <span
          className={clsx(utils.raise, classes.stocks, className)}
          data-left={left}
          aria-label={challengeTip(stats, left)}
        >
          <IconHand className={classes.icon} aria-hidden />
          {SLOTS.map((i) => (
            <span key={i} className={classes.stock} data-on={i < left || undefined} />
          ))}
        </span>
      </Tip>
    );
  },
);
