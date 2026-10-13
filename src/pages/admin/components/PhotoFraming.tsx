import { Slider } from '@mantine/core';
import { memo, useCallback, useState, type FC, type KeyboardEvent, type SyntheticEvent } from 'react';

import { ZOOM_MAX, ZOOM_MIN } from '~/api/schemas';
import { FramedPhoto, PlayerAvatar } from '~/components/player';
import type { PhotoCrop } from '~/types';

import { arrowNudge, clampPercent, useDrag, type FramingEditorProps } from './framing';
import { FramingControls } from './FramingControls';

import classes from './PhotoFraming.module.css';

interface Size {
  w: number;
  h: number;
}

const DEFAULT_CROP: PhotoCrop = { x: 50, y: 20, zoom: 1 };
const SQUARE: Size = { w: 1, h: 1 };
const ZOOM_STEP = 0.05;
const KEY_ZOOM_STEP = 0.1;
const KEY_ZOOM: Record<string, number> = { '+': 1, '=': 1, '-': -1, _: -1 };
const PREVIEWS: readonly { size: number; crop?: number }[] = [
  { size: 112, crop: 240 },
  { size: 60 },
  { size: 32, crop: 96 },
];

const clampZoom = (zoom: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom * 100) / 100));

const zoomLabel = (zoom: number) => `${zoom.toFixed(2)}×`;

const cropLabel = (crop: PhotoCrop | null) =>
  crop ? `Zoom ${zoomLabel(crop.zoom)} · ${crop.x}% · ${crop.y}%` : 'Default framing';

const overflowOf = (side: number, zoom: number, natural: Size) => {
  const short = Math.min(natural.w, natural.h);
  return { x: side * ((zoom * natural.w) / short - 1), y: side * ((zoom * natural.h) / short - 1) };
};

const panned = (from: PhotoCrop, dx: number, dy: number, over: { x: number; y: number }): PhotoCrop => ({
  ...from,
  x: over.x > 0 ? clampPercent(from.x - (dx / over.x) * 100, 1) : from.x,
  y: over.y > 0 ? clampPercent(from.y - (dy / over.y) * 100, 1) : from.y,
});

const sameCrop = (a: PhotoCrop, b: PhotoCrop) => a.x === b.x && a.y === b.y && a.zoom === b.zoom;

const Stage: FC<{
  image: string;
  crop: PhotoCrop;
  natural: Size;
  onLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  onDrag: (crop: PhotoCrop | null) => void;
  onCommit: (crop: PhotoCrop) => void;
}> = ({ image, crop, natural, onLoad, onDrag, onCommit }) => {
  const drag = useDrag(
    (e) => ({
      x: e.clientX,
      y: e.clientY,
      from: crop,
      over: overflowOf(e.currentTarget.getBoundingClientRect().width, crop.zoom, natural),
    }),
    (s, e) => onDrag(panned(s.from, e.clientX - s.x, e.clientY - s.y, s.over)),
    (s, e) => {
      onDrag(null);
      const next = panned(s.from, e.clientX - s.x, e.clientY - s.y, s.over);
      if (!sameCrop(next, s.from)) onCommit(next);
    },
  );
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const nudge = arrowNudge(e);
    if (nudge) return onCommit({ ...crop, x: clampPercent(crop.x + nudge.dx), y: clampPercent(crop.y + nudge.dy) });
    const zoom = KEY_ZOOM[e.key];
    if (!zoom) return;
    e.preventDefault();
    onCommit({ ...crop, zoom: clampZoom(crop.zoom + zoom * KEY_ZOOM_STEP) });
  };
  return (
    <button
      type="button"
      className={classes.stage}
      aria-label={`Photo crop: ${cropLabel(crop)}. Drag to move, arrow keys to nudge, plus and minus to zoom`}
      {...drag}
      onKeyDown={onKey}
    >
      <FramedPhoto src={image} framing={crop} onLoad={onLoad} />
      <span className={classes.mask} />
    </button>
  );
};

export const PhotoFraming = memo<
  FramingEditorProps<PhotoCrop> & {
    id: string;
    name: string;
    photo: string;
    image: string;
  }
>(({ id, name, photo, image, focus, flip, flipBlocked, busy = false, status, onChange }) => {
  const [drag, setDrag] = useState<PhotoCrop | null>(null);
  const [natural, setNatural] = useState<Size>(SQUARE);
  const shown = drag ?? focus;
  const stage = shown ?? DEFAULT_CROP;
  const onLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) =>
      setNatural({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 }),
    [],
  );
  const onCommit = useCallback((next: PhotoCrop) => onChange({ focus: next, flip }), [onChange, flip]);
  const onZoom = useCallback((zoom: number) => setDrag({ ...(focus ?? DEFAULT_CROP), zoom }), [focus]);
  const onZoomEnd = useCallback(
    (zoom: number) => {
      setDrag(null);
      onCommit({ ...(focus ?? DEFAULT_CROP), zoom });
    },
    [focus, onCommit],
  );
  const onFlip = useCallback((next: boolean) => onChange({ focus, flip: next }), [onChange, focus]);
  const onReset = useCallback(() => onChange({ focus: null, flip: false }), [onChange]);
  return (
    <div className={classes.framing}>
      <Stage image={image} crop={stage} natural={natural} onLoad={onLoad} onDrag={setDrag} onCommit={onCommit} />
      <FramingControls
        title="Photo framing"
        readout={cropLabel(shown)}
        flip={flip}
        flipBlocked={flipBlocked}
        busy={busy}
        resettable={!!focus || flip}
        status={status}
        onFlip={onFlip}
        onReset={onReset}
      >
        <Slider
          className={classes.zoom}
          thumbLabel="Zoom"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={stage.zoom}
          label={zoomLabel}
          size="lg"
          thumbSize={28}
          onChange={onZoom}
          onChangeEnd={onZoomEnd}
        />
        <div className={classes.previews}>
          {PREVIEWS.map((p) => (
            <PlayerAvatar key={p.size} id={id} name={name} photo={photo} size={p.size} crop={p.crop} framing={shown} />
          ))}
        </div>
      </FramingControls>
    </div>
  );
});
