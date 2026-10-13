import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import { SectionTitle } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Level, Tournament } from '~/types';
import { isHeld } from '~/utils/tournaments';

import { LEGEND_LEVELS } from '../constants';
import { SeasonStatus, type SeasonFocus } from '../types';
import { filterSeason, nearestShown, toggleShown } from '../utils';
import { SeasonLegend } from './SeasonLegend';
import { SeasonMap } from './SeasonMap';
import { SeasonStrip } from './SeasonStrip';
import { SeasonWheel } from './SeasonWheel';
import { SelectedEvent } from './SelectedEvent';

import classes from './SeasonCard.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/about');

export const SeasonCard = memo<{ tournaments: Tournament[]; year: number; focus: SeasonFocus }>(
  ({ tournaments, year, focus }) => {
    const isMobile = useIsMobile();
    const { levels, status } = route.useSearch();
    const navigate = route.useNavigate();
    const [code, setCode] = useState<string | null>(null);
    const shown = useMemo(() => filterSeason(tournaments, focus, levels, status), [tournaments, focus, levels, status]);
    const picked = code ? tournaments.find((t) => t.code === code) : undefined;
    const hovered = picked && shown.includes(picked) ? picked : undefined;
    const selected = useMemo(
      () => (isMobile ? nearestShown(tournaments, shown, picked ?? focus.focus) : undefined),
      [isMobile, tournaments, shown, picked, focus.focus],
    );
    const active = isMobile ? selected : hovered;
    const held = useMemo(() => tournaments.filter(isHeld), [tournaments]);
    const done = held.filter((t) => t.status === 'done').length;
    const onLevel = useCallback(
      (l: Level) =>
        void navigate({
          search: (s) => ({ ...s, levels: toggleShown(LEGEND_LEVELS, s.levels, l) }),
          resetScroll: false,
        }),
      [navigate],
    );
    const onStatus = useCallback(
      (v: SeasonStatus) =>
        void navigate({
          search: (s) => ({ ...s, status: toggleShown(SeasonStatus.options, s.status, v) }),
          resetScroll: false,
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
      <section className={clsx(utils.card, classes.card)} aria-label={`${year} season map`}>
        <SectionTitle count={`${done} of ${held.length} completed`}>{`${year} season`}</SectionTitle>
        <div className={classes.mapWrap}>
          <SeasonMap tournaments={shown} focus={focus} active={active} interactive={!isMobile} onActive={setCode} />
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
      </section>
    );
  },
);
