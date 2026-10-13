import { clsx } from 'clsx'
import { memo, useCallback, type FC } from 'react'

import {
  bwfValue,
  formatField,
  freshDraft,
  withValue,
  type FieldChange,
  type FieldDef,
  type FieldDraft,
  type FieldInput,
} from '../fields'
import { isImageField, type AdminPlayer, type ImageResult, type Provenance } from '../schema'
import { ImageThumb, ProvenanceInputs } from './FieldInputs'
import { FIELD_INPUTS } from './inputMap'

import classes from './FieldRow.module.css'
import utils from '~/styles/utils.module.css'

const EMPTY = '—'

const BLOCK_INPUTS: ReadonlySet<FieldInput> = new Set<FieldInput>(['image', 'long'])

const BwfValue: FC<{ field: FieldDef; playerId: string; value: string }> = ({ field, playerId, value }) => {
  if (!value) return <span className={classes.empty}>{EMPTY}</span>
  if (isImageField(field.key)) return <ImageThumb kind={field.key} playerId={playerId} value={value} />
  return <span className={classes.bwfValue}>{formatField(field, value)}</span>
}

export const FieldRow = memo<{
  field: FieldDef
  player: AdminPlayer
  draft: FieldDraft | undefined
  onChange: FieldChange
}>(({ field, player, draft, onChange }) => {
  const { key } = field
  const bwf = bwfValue(player, key)
  const bwfShown = formatField(field, bwf)
  const image = isImageField(key)
  const Input = FIELD_INPUTS[field.input]
  const inline = !BLOCK_INPUTS.has(field.input)

  const onValue = useCallback((value: string) => onChange(key, withValue(draft, value)), [key, draft, onChange])
  const onImage = useCallback(
    (img: ImageResult) => onChange(key, freshDraft(img.source, img.source), img),
    [key, onChange],
  )
  const onRevert = useCallback(() => onChange(key, undefined), [key, onChange])
  const onProvenance = useCallback(
    (p: Provenance) => draft && onChange(key, { ...draft, ...p }),
    [key, draft, onChange],
  )

  return (
    <div
      className={classes.field}
      data-active={draft ? true : undefined}
      data-wide={field.input === 'long' || undefined}
    >
      <div className={classes.head}>
        <span className={classes.label}>{field.label}</span>
        {inline && (
          <span className={clsx(utils.ellipsis, classes.inline)} title={bwfShown}>
            <span className={classes.tag}>BWF</span> {bwfShown || EMPTY}
          </span>
        )}
        {draft && (
          <button type="button" className={classes.revert} onClick={onRevert}>
            {image ? 'Remove override' : 'Revert to BWF'}
          </button>
        )}
      </div>
      {!inline && (
        <div className={classes.bwf}>
          <span className={classes.tag}>BWF</span>
          <BwfValue field={field} playerId={player.id} value={bwf} />
        </div>
      )}
      <Input
        field={field}
        playerId={player.id}
        value={draft?.value ?? ''}
        placeholder={bwf && !image ? 'Same as BWF' : 'No override'}
        bwf={bwf}
        onValue={onValue}
        onImage={onImage}
      />
      {draft && <ProvenanceInputs value={draft} onChange={onProvenance} />}
    </div>
  )
})
