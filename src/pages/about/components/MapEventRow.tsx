import { useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo } from 'react';

import { LogoTile } from '~/components/tournament';
import { LEVEL_VARS } from '~/constants';
import type { Tournament } from '~/types';
import { joinDots } from '~/utils/format';
import { tournamentParams } from '~/utils/tournaments';

import type { SeasonFocus } from '../types';
import { kickerOf, shortStatus } from '../utils';

import classes from './MapEventRow.module.css';
import utils from '~/styles/utils.module.css';

export const MapEventRow = memo<{ tournament: Tournament; focus: SeasonFocus }>(({ tournament: t, focus }) => {
  const { i18n } = useLingui();
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={classes.row}
      style={LEVEL_VARS[t.level]}
      data-status={t.status}
      data-tone={t === focus.finals ? 'gold' : undefined}
    >
      <LogoTile src={t.logo} name={t.name} size={32} flat />
      <span className={classes.text}>
        <span className={classes.kicker}>{kickerOf(i18n, t, focus)}</span>
        <span className={clsx(classes.title, utils.ellipsis, utils.bidiAuto)}>{t.title}</span>
        <span className={clsx(classes.meta, utils.ellipsis, utils.num)}>{joinDots([t.city, t.dates])}</span>
      </span>
      <span className={classes.status}>{shortStatus(i18n, t)}</span>
    </Link>
  );
});
