import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { getRouteApi } from '@tanstack/react-router';
import { memo, useCallback, useMemo, useState } from 'react';

import { useIsMobile } from '~/hooks/useIsMobile';
import type { Level, Tournament } from '~/types';
import { STAY } from '~/utils/navigation';
import { isHeld } from '~/utils/tournaments';

import { LEGEND_LEVELS } from '../constants';
import { SeasonStatus, type SeasonFocus } from '../types';
import { filterSeason, homeView, nearestShown, toggleShown } from '../utils';
import { SeasonFrame } from './SeasonFrame';
import { SeasonLegend } from './SeasonLegend';
import { SeasonMap } from './SeasonMap';
import { SeasonStrip } from './SeasonStrip';
import { SeasonWheel } from './SeasonWheel';
import { SelectedEvent } from './SelectedEvent';

import classes from './SeasonCard.module.css';

const route = getRouteApi('/about');

const COMPLETED = msg({
  message: '{total, plural, one {{done} of # completed} other {{done} of # completed}}',
  comment: 'About page season card: {done} tournaments finished out of the season’s total',
});

export const SeasonCard = memo<{ tournaments: Tournament[]; year: number; focus: SeasonFocus }>(
  ({ tournaments, year, focus }) => {
    const isMobile = useIsMobile();
    const { i18n } = useLingui();
    const { levels, status } = route.useSearch();
    const navigate = route.useNavigate();
    const [code, setCode] = useState<string | null>(null);
    const shown = useMemo(() => filterSeason(tournaments, focus, levels, status), [tournaments, focus, levels, status]);
    const picked = code ? tournaments.find((e) => e.code === code) : undefined;
    const hovered = picked && shown.includes(picked) ? picked : undefined;
    const selected = useMemo(
      () => (isMobile ? nearestShown(tournaments, shown, picked ?? focus.focus) : undefined),
      [isMobile, tournaments, shown, picked, focus.focus],
    );
    const active = isMobile ? selected : hovered;
    const held = useMemo(() => tournaments.filter(isHeld), [tournaments]);
    const home = useMemo(() => homeView(tournaments, focus), [tournaments, focus]);
    const done = held.filter((e) => e.status === 'done').length;
    const total = held.length;
    const onLevel = useCallback(
      (l: Level) =>
        void navigate({
          search: (s) => ({ ...s, levels: toggleShown(LEGEND_LEVELS, s.levels, l) }),
          ...STAY,
        }),
      [navigate],
    );
    const onStatus = useCallback(
      (v: SeasonStatus) =>
        void navigate({
          search: (s) => ({ ...s, status: toggleShown(SeasonStatus.options, s.status, v) }),
          ...STAY,
        }),
      [navigate],
    );
    const legend = (
      <SeasonLegend
        compact={isMobile}
        live={!!focus.live}
        levels={levels}
        status={status}
        onLevel={onLevel}
        onStatus={onStatus}
      />
    );
    return (
      <SeasonFrame year={year} className={classes.card} count={i18n._({ ...COMPLETED, values: { total, done } })}>
        <div className={classes.mapWrap}>
          <SeasonMap
            tournaments={shown}
            focus={focus}
            home={home}
            active={active}
            interactive={!isMobile}
            onActive={setCode}
          />
          {!isMobile && legend}
        </div>
        {isMobile && legend}
        {isMobile ? (
          <>
            <SeasonWheel tournaments={shown} focus={focus} selected={selected} onSelect={setCode} />
            {selected && <SelectedEvent tournament={selected} />}
          </>
        ) : (
          <SeasonStrip tournaments={shown} year={year} focus={focus} active={hovered} onActive={setCode} />
        )}
      </SeasonFrame>
    );
  },
);
