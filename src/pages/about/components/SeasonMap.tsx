import { useLingui } from '@lingui/react/macro';
import { useComputedColorScheme } from '@mantine/core';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePanZoom, type PanZoomView } from '~/hooks/usePanZoom';
import { useMapRoute, useSettings } from '~/stores/settings';
import type { Tournament } from '~/types';
import { MOD_KEY } from '~/utils/platform';

import { CLOSE_DELAY, MAP_SIZE, MAP_ZOOM, PIN_GAP_PX, REVEAL_INSET, WHEEL_HINT_MS, WIDTH_STEP } from '../constants';
import {
  drawLand,
  landDetail,
  landRect,
  loadLand,
  placeRect,
  type DrawnLand,
  type LandDetail,
  type LandShapes,
} from '../landLayer';
import type { OnActive, SeasonFocus } from '../types';
import { relaxPins, routePaths } from '../utils';
import { MapControls, type MapTarget } from './MapControls';
import { MapPin } from './MapPin';
import { MapPopover } from './MapPopover';
import { MapRoute } from './MapRoute';

import classes from './SeasonMap.module.css';

const mapTarget = (f: SeasonFocus): MapTarget | undefined => {
  if (f.live) return 'live';
  return f.next ? 'next' : undefined;
};

const toggleRoute = () => {
  const s = useSettings.getState();
  s.set({ mapRoute: !s.mapRoute });
};

const shapesFor = (have: Partial<Record<LandDetail, LandShapes>>, want: LandDetail) =>
  have[want] ? want : (Object.keys(have) as LandDetail[]).at(0);

export const SeasonMap = memo<{
  tournaments: Tournament[];
  focus: SeasonFocus;
  home: PanZoomView;
  active: Tournament | undefined;
  interactive: boolean;
  onActive: OnActive;
}>(({ tournaments, focus, home, active, interactive, onActive }) => {
  const { t } = useLingui();
  const scheme = useComputedColorScheme('dark');
  const svg = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const land = useRef<Partial<Record<LandDetail, LandShapes>>>({});
  const drawn = useRef<DrawnLand | null>(null);
  const tone = useRef(scheme);
  const timer = useRef(0);
  const hintTimer = useRef(0);
  const own = useRef<string | null>(null);
  const last = useRef(active?.code);
  const [hint, setHint] = useState(false);
  const showRoute = useMapRoute();

  const paint = useCallback((v: PanZoomView, px: number) => {
    const used = shapesFor(land.current, landDetail(v, px));
    const look = `${tone.current}-${used ?? ''}`;
    const rect = landRect(v, px, look, drawn.current);
    const fresh = rect !== drawn.current?.rect;
    if (svg.current) {
      if (fresh) svg.current.setAttribute('viewBox', `${rect.x} ${rect.y} ${rect.w} ${rect.h}`);
      if (px) svg.current.style.setProperty('--unit', `${MAP_SIZE.w / (px * v.k)}`);
      placeRect(svg.current, rect, v, px);
    }
    if (!canvas.current || !px) return;
    if (fresh) drawLand(canvas.current, used && land.current[used], v, px, rect);
    placeRect(canvas.current, rect, v, px);
    drawn.current = { rect, k: v.k, px, look };
  }, []);

  const showHint = useCallback(() => {
    setHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(false), WHEEL_HINT_MS);
  }, []);

  const {
    ref,
    layerRef,
    counterRef,
    view,
    frameWidth,
    atHome,
    atWorld,
    canZoomIn,
    canZoomOut,
    zoomBy,
    reset,
    goHome,
    reveal,
    refresh,
  } = usePanZoom<HTMLDivElement>({
    width: MAP_SIZE.w,
    height: MAP_SIZE.h,
    maxZoom: MAP_ZOOM.max,
    home,
    onSettle: paint,
    onBlockedWheel: interactive ? showHint : undefined,
  });

  const width = frameWidth ? Math.max(WIDTH_STEP, Math.round(frameWidth / WIDTH_STEP) * WIDTH_STEP) : 0;
  const gapPx = interactive ? PIN_GAP_PX.desktop : PIN_GAP_PX.mobile;
  const gap = width ? (gapPx * MAP_SIZE.w) / (width * view.k) : 0;
  const spots = useMemo(() => (gap ? relaxPins(tournaments, gap) : []), [tournaments, gap]);
  const routes = useMemo(() => routePaths(tournaments), [tournaments]);
  const shown = active ? spots.find((s) => s.t === active) : undefined;
  const target = mapTarget(focus);

  const zoomIn = useCallback(() => zoomBy(MAP_ZOOM.step), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / MAP_ZOOM.step), [zoomBy]);

  const cancel = useCallback(() => window.clearTimeout(timer.current), []);
  const enter = useCallback<OnActive>(
    (code) => {
      window.clearTimeout(timer.current);
      own.current = code;
      onActive(code);
    },
    [onActive],
  );
  const leave = useCallback(() => {
    window.clearTimeout(timer.current);
    own.current = null;
    timer.current = window.setTimeout(() => onActive(null), CLOSE_DELAY);
  }, [onActive]);

  useEffect(() => {
    const code = active?.code;
    if (code === last.current) return;
    last.current = code;
    if (!active?.map || code === own.current) return;
    reveal(active.map, interactive ? REVEAL_INSET.desktop : REVEAL_INSET.mobile);
  }, [active, interactive, reveal]);

  const detail = frameWidth ? landDetail(view, frameWidth) : undefined;

  useEffect(() => {
    if (!detail || land.current[detail]) return;
    void loadLand(detail).then((shapes) => {
      if (!shapes) return;
      land.current[detail] = shapes;
      refresh();
    });
  }, [detail, refresh]);

  useEffect(() => {
    tone.current = scheme;
    refresh();
  }, [refresh, scheme]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(hintTimer.current);
    },
    [],
  );

  return (
    <div ref={ref} className={classes.stage} dir="ltr" tabIndex={-1} data-highlight={shown ? true : undefined}>
      <div className={classes.viewport}>
        <div ref={layerRef} className={classes.world}>
          <canvas ref={canvas} className={classes.land} aria-hidden />
          <svg ref={svg} className={classes.surface} preserveAspectRatio="none" aria-hidden>
            {showRoute && (
              <g className={classes.routes}>
                {routes.map((r) => (
                  <MapRoute key={r.key} leg={r} />
                ))}
              </g>
            )}
            {spots.map(
              (s) =>
                s.moved && (
                  <g key={s.t.code} className={classes.leader} data-active={s === shown || undefined}>
                    <line x1={s.ax} y1={s.ay} x2={s.x} y2={s.y} />
                    <path d={`M${s.ax} ${s.ay}h0`} />
                  </g>
                ),
            )}
          </svg>
          <div ref={counterRef} className={classes.pins} aria-hidden={interactive ? undefined : true}>
            {spots.map((s) => (
              <MapPin
                key={s.t.code}
                spot={s}
                focus={focus}
                active={s === shown}
                interactive={interactive}
                onActive={enter}
                onLeave={leave}
              />
            ))}
          </div>
        </div>
      </div>
      {interactive && shown && <MapPopover spot={shown} focus={focus} view={view} onEnter={cancel} onLeave={leave} />}
      <MapControls
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        atWorld={atWorld}
        atHome={atHome}
        target={target}
        route={showRoute}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
        onFocus={goHome}
        onRoute={toggleRoute}
      />
      {interactive && (
        <span className={classes.hint} data-on={hint || undefined} aria-hidden>
          {t({
            message: `${MOD_KEY} + scroll to zoom`,
            comment:
              'Hint over the About page season map when the reader scrolls over it: hold {MOD_KEY} (Ctrl or ⌘) while scrolling to zoom the map',
          })}
        </span>
      )}
    </div>
  );
});
