import { Button, Select } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { IconButton, IconClose, Segmented, type SegmentedOption } from '~/components/ui';
import { plural } from '~/utils/format';

import { useBulkOverride } from '../api';
import { BIO_FIELDS, FIELD_BY_KEY, planBulk, todayStamp, type BulkChange } from '../fields';
import { DEFAULT_SOURCE, type AdminPlayer, type BioFieldKey, type BulkFieldChange, type Provenance } from '../schema';
import { AdminModal } from './AdminModal';
import { ChangePreview, PreviewSummary } from './ChangePreview';
import { ProvenanceInputs } from './FieldInputs';
import { FIELD_INPUTS } from './inputMap';
import { exportedIn, FLOATING_PROPS, INPUT_CLASSES } from './inputs';
import { SaveStatus } from './SaveStatus';

import classes from './BulkEditor.module.css';
import parts from './ModalParts.module.css';
import utils from '~/styles/utils.module.css';

type BulkAction = 'set' | 'clear';

interface FieldEdit {
  id: number;
  field: BioFieldKey;
  action: BulkAction;
  value: string;
}

interface FieldPlan {
  edit: FieldEdit;
  label: string;
  value: string | null;
  changes: BulkChange[];
}

const PREFERRED_FIELDS: readonly BioFieldKey[] = ['bio.racket', 'bio.tension', 'bio.string', 'bio.shoes'];

const ACTION_OPTIONS: readonly SegmentedOption<BulkAction>[] = [
  { value: 'set', label: 'Set value' },
  { value: 'clear', label: 'Revert to BWF' },
];

const FIELD_GROUPS = [...new Set(BIO_FIELDS.map((f) => f.group))];

const fieldData = (used: ReadonlySet<BioFieldKey>, own: BioFieldKey) =>
  FIELD_GROUPS.map((group) => ({
    group,
    items: BIO_FIELDS.filter((f) => f.group === group).map((f) => ({
      value: f.key,
      label: f.label,
      disabled: f.key !== own && used.has(f.key),
    })),
  }));

const isBioFieldKey = (v: string | null): v is BioFieldKey => !!v && FIELD_BY_KEY.has(v as BioFieldKey);

const nextField = (used: ReadonlySet<BioFieldKey>) =>
  [...PREFERRED_FIELDS, ...BIO_FIELDS.map((f) => f.key)].find((k) => FIELD_BY_KEY.has(k) && !used.has(k));

const newEdit = (id: number, field: BioFieldKey): FieldEdit => ({ id, field, action: 'set', value: '' });

const nextValueOf = (e: FieldEdit) => (e.action === 'set' ? e.value.trim() : null);

const noop = () => {};

const FieldEditRow = memo<{
  edit: FieldEdit;
  used: ReadonlySet<BioFieldKey>;
  removable: boolean;
  onChange: (edit: FieldEdit) => void;
  onRemove: (id: number) => void;
}>(({ edit, used, removable, onChange, onRemove }) => {
  const def = FIELD_BY_KEY.get(edit.field);
  const Input = FIELD_INPUTS[def?.input ?? 'text'];
  const data = useMemo(() => fieldData(used, edit.field), [used, edit.field]);
  const onField = useCallback(
    (v: string | null) => isBioFieldKey(v) && onChange({ ...edit, field: v, value: '' }),
    [edit, onChange],
  );
  const onAction = useCallback((v: BulkAction | null) => v && onChange({ ...edit, action: v }), [edit, onChange]);
  const onValue = useCallback((value: string) => onChange({ ...edit, value }), [edit, onChange]);
  const remove = useCallback(() => onRemove(edit.id), [edit.id, onRemove]);
  return (
    <div className={classes.edit}>
      <Select
        label="Field"
        data={data}
        value={edit.field}
        onChange={onField}
        allowDeselect={false}
        searchable
        comboboxProps={FLOATING_PROPS}
        classNames={INPUT_CLASSES}
      />
      <div className={classes.action}>
        <span className={classes.label}>Action</span>
        <Segmented options={ACTION_OPTIONS} value={edit.action} onChange={onAction} height={30} />
      </div>
      {removable && (
        <IconButton label="Remove field" variant="ghost" className={classes.remove} onClick={remove}>
          <IconClose size={14} />
        </IconButton>
      )}
      {edit.action === 'set' && def && (
        <div className={classes.wide}>
          <span className={classes.label}>New value</span>
          <Input field={def} playerId="" value={edit.value} placeholder="New value" onValue={onValue} onImage={noop} />
        </div>
      )}
    </div>
  );
});

export const BulkEditor: FC<{ opened: boolean; onClose: () => void; players: readonly AdminPlayer[] }> = ({
  opened,
  onClose,
  players,
}) => {
  const [edits, setEdits] = useState<FieldEdit[]>(() => [newEdit(0, PREFERRED_FIELDS[0] ?? 'bio.racket')]);
  const [provenance, setProvenance] = useState<Provenance>(() => ({ source: DEFAULT_SOURCE, asOf: todayStamp() }));
  const { mutate, isPending, error, data, reset } = useBulkOverride();

  const used = useMemo(() => new Set(edits.map((e) => e.field)), [edits]);
  const spare = nextField(used);
  const plans = useMemo(
    () =>
      edits.map((edit): FieldPlan => {
        const value = nextValueOf(edit);
        return {
          edit,
          label: FIELD_BY_KEY.get(edit.field)?.label ?? edit.field,
          value,
          changes: value === '' ? [] : planBulk(players, edit.field, value),
        };
      }),
    [edits, players],
  );
  const active = plans.filter((p) => p.changes.length);
  const ids = useMemo(() => [...new Set(active.flatMap((p) => p.changes.map((c) => c.player.id)))], [active]);

  const onEdit = useCallback(
    (edit: FieldEdit) => {
      reset();
      setEdits((list) => list.map((e) => (e.id === edit.id ? edit : e)));
    },
    [reset],
  );
  const onRemove = useCallback(
    (id: number) => {
      reset();
      setEdits((list) => list.filter((e) => e.id !== id));
    },
    [reset],
  );
  const onAdd = useCallback(() => {
    if (!spare) return;
    reset();
    setEdits((list) => [...list, newEdit(Math.max(...list.map((e) => e.id)) + 1, spare)]);
  }, [spare, reset]);
  const onClosed = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);
  const onApply = useCallback(
    () =>
      mutate({
        ids,
        changes: active.map((p): BulkFieldChange => ({ field: p.edit.field, value: p.value })),
        source: provenance.source.trim() || DEFAULT_SOURCE,
        asOf: provenance.asOf,
      }),
    [mutate, ids, active, provenance],
  );

  return (
    <AdminModal
      opened={opened}
      onClose={onClosed}
      size={820}
      title={
        <div className={parts.title}>
          <h2 className={parts.heading}>Bulk edit</h2>
          <span className={clsx(utils.num, parts.sub)}>{plural(players.length, 'player')} selected</span>
        </div>
      }
      actions={
        <Button radius="xl" onClick={onApply} disabled={!ids.length || isPending} loading={isPending}>
          {ids.length ? `Update ${plural(ids.length, 'player')}` : 'Update'}
        </Button>
      }
      status={
        <SaveStatus
          pending={isPending}
          error={error}
          done={data && `Updated ${plural(data.changed, 'player')} · ${exportedIn(data.exportMs)}`}
        />
      }
    >
      <div className={parts.form}>
        {edits.map((e) => (
          <FieldEditRow
            key={e.id}
            edit={e}
            used={used}
            removable={edits.length > 1}
            onChange={onEdit}
            onRemove={onRemove}
          />
        ))}
        <div className={classes.add}>
          {spare && (
            <Button variant="subtle" radius="xl" size="compact-sm" onClick={onAdd}>
              + Add field
            </Button>
          )}
        </div>
        <ProvenanceInputs value={provenance} onChange={setProvenance} />
      </div>
      <PreviewSummary players={ids.length} fields={active.length} />
      {plans.map((p) => (
        <ChangePreview key={p.edit.id} label={p.label} field={FIELD_BY_KEY.get(p.edit.field)} changes={p.changes} />
      ))}
    </AdminModal>
  );
};
