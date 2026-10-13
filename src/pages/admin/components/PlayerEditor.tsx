import { Button, Textarea } from '@mantine/core'
import { clsx } from 'clsx'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FC,
  type RefObject,
} from 'react'

import { Flag } from '~/components/country'
import { EventTag } from '~/components/match'
import { PlayerAvatar } from '~/components/player'
import { IconButton, IconExternal } from '~/components/ui'
import { countryName } from '~/utils/countries'
import { formatRank } from '~/utils/format'

import { useSaveOverride } from '../api'
import {
  displayName,
  effectiveImage,
  FIELD_GROUPS,
  fromDraft,
  IMAGES,
  nameError,
  toDraft,
  type Draft,
  type FieldChange,
} from '../fields'
import { canonicalOverride, FRAMING_OF, isImageField, sameOverride, type AdminPlayer, type ImageKind } from '../schema'
import { AdminModal } from './AdminModal'
import { FieldRow } from './FieldRow'
import { HeroFramingField, PhotoFramingField } from './FramingField'
import { exportedIn, INPUT_CLASSES } from './inputs'
import { SaveStatus } from './SaveStatus'

import classes from './PlayerEditor.module.css'
import utils from '~/styles/utils.module.css'

const DISCARD_PROMPT = 'Discard unsaved changes?'
const EDITOR_SIZE = 'min(1360px, calc(100vw - 48px))'

const blockUnload = (e: BeforeUnloadEvent) => e.preventDefault()

const EditorTitle = memo<{ player: AdminPlayer; name: string }>(({ player, name }) => (
  <>
    <PlayerAvatar id={player.id} name={name} photo={effectiveImage(player, 'photo')} size={44} />
    <div className={classes.who}>
      <h2 className={clsx(utils.ellipsis, classes.name)}>{name}</h2>
      <span className={classes.meta}>
        <Flag cc={player.cc} size="sm" tip={false} />
        {countryName(player.cc)}
        <span className={utils.num}>· {player.id}</span>
        {player.rank && <span className={utils.num}>· WR {formatRank(player.rank)}</span>}
        {player.rankEvent && <EventTag event={player.rankEvent} />}
      </span>
    </div>
  </>
))

const EditorBody: FC<{
  player: AdminPlayer
  dirtyRef: RefObject<boolean>
  opened: boolean
  onClose: () => void
  onExited: () => void
}> = ({ player, dirtyRef, opened, onClose, onExited }) => {
  const [base, setBase] = useState(() => canonicalOverride(player.override))
  const [draft, setDraft] = useState<Draft>(() => toDraft(base))
  const [versions, setVersions] = useState<Partial<Record<ImageKind, number>>>({})
  const { mutate, isPending, error, data, reset } = useSaveOverride(player.id)
  const next = useMemo(() => fromDraft(draft, base), [draft, base])
  const dirty = !sameOverride(next, base)
  const name = displayName(player)
  const invalid = !!nameError(draft)

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty, dirtyRef])

  useEffect(() => {
    if (!dirty) return
    window.addEventListener('beforeunload', blockUnload)
    return () => window.removeEventListener('beforeunload', blockUnload)
  }, [dirty])

  const onField = useCallback<FieldChange>(
    (key, value, image) => {
      reset()
      if (isImageField(key) && image) setVersions((v) => ({ ...v, [key]: Date.now() }))
      setDraft((d) => {
        const fields = { ...d.fields }
        if (isImageField(key) && (image || value?.value !== fields[key]?.value)) {
          delete fields[FRAMING_OF[key].focus]
          delete fields[FRAMING_OF[key].flip]
        }
        if (value) fields[key] = value
        else delete fields[key]
        return { ...d, fields }
      })
    },
    [reset],
  )
  const onNotes = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const notes = e.currentTarget.value
      reset()
      setDraft((d) => ({ ...d, notes }))
    },
    [reset],
  )
  const onSave = useCallback(
    () =>
      mutate(next, {
        onSuccess: ({ entry }) => {
          setBase(entry)
          setDraft(toDraft(entry))
        },
      }),
    [mutate, next],
  )

  return (
    <AdminModal
      opened={opened}
      onClose={onClose}
      onExited={onExited}
      size={EDITOR_SIZE}
      title={<EditorTitle player={player} name={name} />}
      actions={
        <>
          <IconButton
            label="Open public profile"
            tip="Open public profile"
            variant="ghost"
            link={{ to: '/players/$id', params: { id: player.id }, target: '_blank' }}
          >
            <IconExternal size={16} />
          </IconButton>
          <Button radius="xl" onClick={onSave} disabled={!dirty || invalid || isPending} loading={isPending}>
            Save
          </Button>
        </>
      }
      status={
        <SaveStatus
          pending={isPending}
          error={error}
          hint={dirty ? 'Unsaved changes' : undefined}
          done={data && `Saved · ${exportedIn(data.exportMs)}`}
        />
      }
    >
      {FIELD_GROUPS.map(({ group, fields }) => (
        <section key={group} className={classes.group}>
          <h3 className={classes.groupTitle}>{group}</h3>
          <div className={classes.grid}>
            {fields.map((f) => (
              <FieldRow key={f.key} field={f} player={player} draft={draft.fields[f.key]} onChange={onField} />
            ))}
          </div>
          {group === IMAGES && (
            <>
              <PhotoFramingField
                player={player}
                image={draft.fields.photo}
                focus={draft.fields.photoCrop}
                flip={draft.fields.photoFlip}
                version={versions.photo ?? 0}
                onChange={onField}
              />
              <HeroFramingField
                player={player}
                image={draft.fields.hero}
                focus={draft.fields.heroFocus}
                flip={draft.fields.heroFlip}
                version={versions.hero ?? 0}
                onChange={onField}
              />
            </>
          )}
        </section>
      ))}
      <section className={classes.group}>
        <h3 className={classes.groupTitle}>Notes</h3>
        <Textarea
          aria-label="Private notes"
          value={draft.notes}
          onChange={onNotes}
          placeholder="Private, never exported to the public site"
          autosize
          minRows={3}
          maxRows={12}
          classNames={INPUT_CLASSES}
          className={classes.notes}
        />
      </section>
    </AdminModal>
  )
}

export const PlayerEditor = memo<{ player: AdminPlayer | null; onClose: () => void }>(({ player, onClose }) => {
  const dirtyRef = useRef(false)
  const [shown, setShown] = useState(player)
  if (player && player !== shown) setShown(player)

  const onGuardedClose = useCallback(() => {
    if (dirtyRef.current && !window.confirm(DISCARD_PROMPT)) return
    dirtyRef.current = false
    onClose()
  }, [onClose])
  const onExited = useCallback(() => setShown(null), [])

  if (!shown) return null
  return (
    <EditorBody
      key={shown.id}
      player={shown}
      opened={!!player}
      dirtyRef={dirtyRef}
      onClose={onGuardedClose}
      onExited={onExited}
    />
  )
})
