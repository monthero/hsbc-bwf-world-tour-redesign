import { Trans } from '@lingui/react/macro';
import type { FC } from 'react';

import type { SeasonSummary } from '~/types';
import { knownFinalsCity } from '~/utils/tournaments';

export const SeasonHeading: FC<{ season: SeasonSummary }> = ({ season }) => {
  const city = knownFinalsCity(season.finals);
  return city ? (
    <Trans comment="Calendar page heading: the season as a journey towards the host city of the World Tour Finals, e.g. “Road to Hangzhou”">
      Road to <span>{city}</span>
    </Trans>
  ) : (
    <Trans comment="Calendar page heading: the season as a journey towards the World Tour Finals (the season-ending tournament), when its host city is not known yet">
      Road to <span>the Finals</span>
    </Trans>
  );
};
