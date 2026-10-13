import { memo, useCallback, useMemo, type FC, type ReactNode } from 'react';

import type { Focus } from '~/types';
import { playerHeroSourceUrl, playerHeroUrl, playerThumbUrl } from '~/utils/images';
import { toPlayer } from '~/utils/names';

import { useFetchImage } from '../api';
import {
  displayName,
  effectiveValue,
  overrideImage,
  versioned,
  withValue,
  type FieldChange,
  type FieldDraft,
} from '../fields';
import {
  CropCodec,
  FlipCodec,
  FocusCodec,
  FRAMING_OF,
  NAME_KEY,
  type AdminPlayer,
  type Codec,
  type ImageKind,
  type Provenance,
} from '../schema';
import { ImageStatus, ProvenanceInputs } from './FieldInputs';
import { mirrored, type Framing, type FramingEditorProps } from './framing';
import { HeroFraming } from './HeroFraming';
import { PhotoFraming } from './PhotoFraming';

import classes from './FramingField.module.css';

const THUMB_WIDTH = 960;

export interface FramingFieldProps {
  player: AdminPlayer;
  image: FieldDraft | undefined;
  focus: FieldDraft | undefined;
  flip: FieldDraft | undefined;
  version: number;
  onChange: FieldChange;
}

const useFraming = <F extends Focus>(
  kind: ImageKind,
  codec: Codec<F>,
  { player, image, focus, flip, version, onChange }: FramingFieldProps,
) => {
  const { mutate, isPending, error, data, reset } = useFetchImage();
  const keys = FRAMING_OF[kind];
  const own = image?.value.trim() ?? '';
  const value = own || player[kind] || '';
  const local = !!own;
  const src = local ? versioned(overrideImage(kind, player.id, own), version) : value;
  const point = useMemo(() => codec.decode(focus?.value), [codec, focus?.value]);
  const flipped = !!FlipCodec.decode(flip?.value);
  const status = useMemo(() => <ImageStatus error={error} image={data} />, [error, data]);

  const setFocus = useCallback(
    (next: F | null) => onChange(keys.focus, withValue(focus, codec.encode(next))),
    [keys, focus, codec, onChange],
  );
  const onFraming = useCallback(
    (next: Framing<F>) => {
      reset();
      if (next.flip === flipped) return setFocus(next.focus);
      mutate(
        { id: player.id, kind, url: own, flip: next.flip },
        {
          onSuccess: (img) => {
            onChange(kind, image, img);
            onChange(keys.flip, withValue(flip, FlipCodec.encode(next.flip)));
            setFocus(mirrored(next.focus));
          },
        },
      );
    },
    [reset, flipped, setFocus, mutate, player.id, kind, own, onChange, image, keys, flip],
  );
  const onProvenance = useCallback(
    (p: Provenance) => {
      if (focus) onChange(keys.focus, { ...focus, ...p });
      if (flip) onChange(keys.flip, { ...flip, ...p });
    },
    [focus, flip, keys, onChange],
  );
  const editor = useMemo(
    (): FramingEditorProps<F> => ({
      focus: point,
      flip: flipped,
      flipBlocked: local ? undefined : `Only a fetched (local) ${kind} can be flipped`,
      busy: isPending,
      status,
      onChange: onFraming,
    }),
    [point, flipped, local, kind, isPending, status, onFraming],
  );
  return { own, value, src, editor, provenance: focus ?? flip, onProvenance };
};

const FramingCard: FC<{
  provenance: FieldDraft | undefined;
  onProvenance: (p: Provenance) => void;
  children: ReactNode;
}> = ({ provenance, onProvenance, children }) => (
  <div className={classes.field} data-active={provenance ? true : undefined}>
    {children}
    {provenance && <ProvenanceInputs value={provenance} onChange={onProvenance} />}
  </div>
);

export const HeroFramingField = memo<FramingFieldProps>((props) => {
  const { player } = props;
  const { own, value, src, editor, provenance, onProvenance } = useFraming('hero', FocusCodec, props);
  const heroPlayer = useMemo(() => toPlayer(effectiveValue(player, NAME_KEY), player.cc, player.id), [player]);
  if (!value) return null;
  const image = own ? playerHeroUrl(player.id, src, false) : playerHeroSourceUrl(player.id, value, THUMB_WIDTH);
  return (
    <FramingCard provenance={provenance} onProvenance={onProvenance}>
      <HeroFraming player={heroPlayer} hero={src} image={image} prize={String(player.bio.prize ?? '')} {...editor} />
    </FramingCard>
  );
});

export const PhotoFramingField = memo<FramingFieldProps>((props) => {
  const { player } = props;
  const { src, editor, provenance, onProvenance } = useFraming('photo', CropCodec, props);
  const image = playerThumbUrl(src);
  if (!image) return null;
  return (
    <FramingCard provenance={provenance} onProvenance={onProvenance}>
      <PhotoFraming id={player.id} name={displayName(player)} photo={src} image={image} {...editor} />
    </FramingCard>
  );
});
