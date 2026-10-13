import { Button, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput, MonthPickerInput } from '@mantine/dates';
import { useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';

import { PlayerName } from '~/components/player';
import { ISO_DAY, monthKeyOf, monthOf } from '~/utils/dates';
import { HEIGHT_UNIT } from '~/utils/format';
import { toPlayer } from '~/utils/names';
import { nameIssue } from '~/utils/surname';

import { useFetchImage } from '../api';
import {
  formatField,
  imageSummary,
  imageUrl,
  overrideImageUrl,
  PLAYS_OPTIONS,
  versioned,
  type FieldDef,
} from '../fields';
import type { ImageKind, ImageResult, Provenance } from '../schema';
import { CatalogCascader } from './CatalogCascader';
import { DATE_FORMAT, FLOATING_PROPS, INPUT_CLASSES, MONTH_FORMAT } from './inputs';

import classes from './FieldInputs.module.css';

export interface FieldInputProps {
  field: FieldDef;
  playerId: string;
  value: string;
  placeholder: string;
  bwf?: string;
  onValue: (value: string) => void;
  onImage: (image: ImageResult) => void;
}

const textValue = (onValue: (v: string) => void) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  onValue(e.currentTarget.value);

export const TextField: FC<FieldInputProps> = ({ field, value, placeholder, onValue }) => (
  <TextInput
    aria-label={`${field.label} override`}
    value={value}
    placeholder={placeholder}
    onChange={textValue(onValue)}
    classNames={INPUT_CLASSES}
  />
);

export const NameField: FC<FieldInputProps> = ({ field, playerId, value, placeholder, bwf = '', onValue }) => {
  const shown = value || bwf;
  const preview = useMemo(() => (shown ? toPlayer(shown, '', playerId) : null), [shown, playerId]);
  return (
    <div className={classes.name}>
      <TextInput
        aria-label={`${field.label} override`}
        value={value}
        placeholder={placeholder}
        onChange={textValue(onValue)}
        error={value ? nameIssue(value) : null}
        classNames={INPUT_CLASSES}
      />
      {preview && (
        <span className={classes.namePreview}>
          <span className={classes.previewTag}>Preview</span>
          <PlayerName player={preview} link={false} />
          <span className={classes.previewShort}>
            <PlayerName player={preview} link={false} short />
          </span>
        </span>
      )}
    </div>
  );
};

const HEIGHT_MIN = 120;
const HEIGHT_MAX = 230;
const HEIGHT_START = 175;

const HEIGHT_SUFFIX = ` ${HEIGHT_UNIT}`;

export const HeightField: FC<FieldInputProps> = ({ field, value, placeholder, bwf = '', onValue }) => {
  const bwfCm = Number(bwf);
  return (
    <NumberInput
      aria-label={`${field.label} override`}
      value={Number(value) || ''}
      placeholder={bwfCm ? formatField(field, bwf) : placeholder}
      onChange={(v) => onValue(typeof v === 'number' ? String(v) : '')}
      suffix={HEIGHT_SUFFIX}
      min={HEIGHT_MIN}
      max={HEIGHT_MAX}
      startValue={bwfCm || HEIGHT_START}
      allowDecimal={false}
      allowNegative={false}
      classNames={INPUT_CLASSES}
    />
  );
};

export const LongField: FC<FieldInputProps> = ({ field, value, placeholder, onValue }) => (
  <Textarea
    aria-label={`${field.label} override`}
    value={value}
    placeholder={placeholder}
    onChange={textValue(onValue)}
    autosize
    minRows={2}
    maxRows={8}
    classNames={INPUT_CLASSES}
  />
);

export const DateField: FC<FieldInputProps> = ({ field, value, placeholder, onValue }) => (
  <DateInput
    aria-label={`${field.label} override`}
    value={value || null}
    placeholder={placeholder}
    onChange={(v) => onValue(v ?? '')}
    valueFormat={DATE_FORMAT}
    defaultLevel="decade"
    clearable
    popoverProps={FLOATING_PROPS}
    classNames={INPUT_CLASSES}
  />
);

export const MonthField: FC<FieldInputProps> = ({ field, value, placeholder, onValue }) => (
  <MonthPickerInput
    aria-label={`${field.label} override`}
    value={value ? monthOf(value).format(ISO_DAY) : null}
    placeholder={placeholder}
    onChange={(v) => onValue(v ? monthKeyOf(v) : '')}
    valueFormat={MONTH_FORMAT}
    clearable
    popoverProps={FLOATING_PROPS}
    classNames={INPUT_CLASSES}
  />
);

export const CatalogField: FC<FieldInputProps> = ({ field, value, placeholder, onValue }) => (
  <CatalogCascader
    kind={field.catalog ?? 'racket'}
    value={value}
    onChange={onValue}
    placeholder={placeholder}
    label={`${field.label} override`}
  />
);

export const PlaysField: FC<FieldInputProps> = ({ field, value, placeholder, onValue }) => (
  <Select
    aria-label={`${field.label} override`}
    data={PLAYS_OPTIONS}
    value={value || null}
    placeholder={placeholder}
    onChange={(v) => onValue(v ?? '')}
    clearable
    comboboxProps={FLOATING_PROPS}
    classNames={INPUT_CLASSES}
  />
);

export const ImageField: FC<FieldInputProps> = ({ field, playerId, value, onImage }) => {
  const kind = field.key as ImageKind;
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState(0);
  const { mutate, isPending, error, data } = useFetchImage();
  const src = overrideImageUrl(kind, playerId, value);
  const onFetch = useCallback(
    () =>
      mutate(
        { id: playerId, kind, url: url.trim() },
        {
          onSuccess: (image) => {
            setVersion(Date.now());
            setUrl('');
            onImage(image);
          },
        },
      ),
    [mutate, playerId, kind, url, onImage],
  );
  return (
    <div className={classes.image}>
      {src && <img className={classes.preview} data-kind={kind} src={versioned(src, version)} alt="" />}
      <div className={classes.fetch}>
        <TextInput
          aria-label={`${field.label} image URL`}
          value={url}
          placeholder="Paste image URL"
          onChange={(e) => setUrl(e.currentTarget.value)}
          classNames={INPUT_CLASSES}
          className={classes.url}
        />
        <Button variant="default" loading={isPending} disabled={!url.trim()} onClick={onFetch}>
          Fetch
        </Button>
      </div>
      <ImageStatus error={error} image={data} />
    </div>
  );
};

export const ImageStatus: FC<{ error: Error | null; image: ImageResult | undefined }> = ({ error, image }) => {
  if (error) return <span className={classes.error}>{error.message}</span>;
  return image ? <span className={classes.stats}>Stored {imageSummary(image)}</span> : null;
};

export const ImageThumb: FC<{ kind: ImageKind; playerId: string; value: string }> = ({ kind, playerId, value }) => {
  const src = imageUrl(kind, playerId, value);
  return src ? <img className={classes.preview} data-kind={kind} src={src} alt="" /> : null;
};

export const ProvenanceInputs: FC<{ value: Provenance; onChange: (value: Provenance) => void }> = ({
  value,
  onChange,
}) => (
  <div className={classes.provenance}>
    <TextInput
      size="xs"
      label="Source"
      value={value.source}
      onChange={(e) => onChange({ ...value, source: e.currentTarget.value })}
      classNames={INPUT_CLASSES}
      className={classes.source}
    />
    <DateInput
      size="xs"
      label="As of"
      value={value.asOf || null}
      onChange={(asOf) => onChange({ ...value, asOf: asOf ?? undefined })}
      valueFormat={DATE_FORMAT}
      clearable
      popoverProps={FLOATING_PROPS}
      classNames={INPUT_CLASSES}
      className={classes.asOf}
    />
  </div>
);
