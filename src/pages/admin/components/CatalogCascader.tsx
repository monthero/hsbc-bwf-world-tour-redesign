import { Button, Cascader, Select, TextInput, type CascaderFormatValue } from '@mantine/core';
import { memo, useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';

import { useAddBrand, useAddEquipment, useAdminPlayers, useEquipment } from '../api';
import { brandMatchers, catalogPath, catalogSearch, catalogTree, guessParts } from '../catalog';
import { buildRows } from '../filters';
import type { AdminPlayer, Brand, EquipmentKind, EquipmentRow } from '../schema';
import { FLOATING_PROPS, INPUT_CLASSES } from './inputs';

import classes from './CatalogCascader.module.css';

const NO_ROWS: readonly EquipmentRow[] = [];
const NO_BRANDS: readonly Brand[] = [];
const NO_PLAYERS: readonly AdminPlayer[] = [];
const DROPDOWN_HEIGHT = 300;
const COLUMN_WIDTH = 190;
const COMBOBOX_PROPS = { ...FLOATING_PROPS, width: 'max-content' };

const formatName: CascaderFormatValue = ({ value }) => value.at(-1) ?? '';

const NewBrand: FC<{ onAdded: (id: string) => void; onCancel: () => void }> = ({ onAdded, onCancel }) => {
  const [name, setName] = useState('');
  const { mutate, isPending, error } = useAddBrand();
  const onSave = () => mutate({ name: name.trim() }, { onSuccess: ({ brand }) => onAdded(brand.id) });
  return (
    <div className={classes.newBrand}>
      <TextInput
        size="xs"
        label="New brand"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        classNames={INPUT_CLASSES}
      />
      <Button size="xs" radius="xl" variant="light" loading={isPending} disabled={!name.trim()} onClick={onSave}>
        Add brand
      </Button>
      <button type="button" className={classes.cancel} onClick={onCancel}>
        Cancel
      </button>
      {error && <span className={classes.error}>{error.message}</span>}
    </div>
  );
};

const AddToCatalog: FC<{
  kind: EquipmentKind;
  value: string;
  brands: readonly Brand[];
  onAdded: (name: string) => void;
}> = ({ kind, value, brands, onAdded }) => {
  const matchers = useMemo(() => brandMatchers(brands), [brands]);
  const brandOptions = useMemo(() => brands.map((b) => ({ value: b.id, label: b.name })), [brands]);
  const [open, setOpen] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [parts, setParts] = useState(() => guessParts(value, matchers));
  const { mutate, isPending, error } = useAddEquipment();

  const onOpen = useCallback(() => {
    setParts(guessParts(value, matchers));
    setOpen(true);
  }, [value, matchers]);
  const onSave = () =>
    mutate(
      { kind, ...parts },
      {
        onSuccess: ({ row }) => {
          setOpen(false);
          onAdded(row.name);
        },
      },
    );
  const onModel = (e: ChangeEvent<HTMLInputElement>) => {
    const model = e.currentTarget.value;
    setParts((p) => ({ ...p, model }));
  };
  const onBrand = (brandId: string | null) => setParts((p) => ({ ...p, brandId: brandId ?? '' }));
  const onBrandAdded = (brandId: string) => {
    setCreatingBrand(false);
    onBrand(brandId);
  };

  if (!open)
    return (
      <button type="button" className={classes.add} onClick={onOpen}>
        + Add new to catalog
      </button>
    );
  return (
    <div className={classes.form}>
      <div className={classes.parts}>
        <Select
          size="xs"
          label="Brand"
          data={brandOptions}
          value={parts.brandId || null}
          onChange={onBrand}
          searchable
          comboboxProps={FLOATING_PROPS}
          classNames={INPUT_CLASSES}
        />
        <TextInput size="xs" label="Model" value={parts.model} onChange={onModel} classNames={INPUT_CLASSES} />
      </div>
      {creatingBrand ? (
        <NewBrand onAdded={onBrandAdded} onCancel={() => setCreatingBrand(false)} />
      ) : (
        <button type="button" className={classes.add} onClick={() => setCreatingBrand(true)}>
          + New brand
        </button>
      )}
      <div className={classes.actions}>
        <Button
          size="xs"
          radius="xl"
          loading={isPending}
          disabled={!parts.brandId || !parts.model.trim()}
          onClick={onSave}
        >
          Save to catalog
        </Button>
        <button type="button" className={classes.cancel} onClick={() => setOpen(false)}>
          Cancel
        </button>
        {error && <span className={classes.error}>{error.message}</span>}
      </div>
    </div>
  );
};

export const CatalogCascader = memo<{
  kind: EquipmentKind;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}>(({ kind, value, onChange, placeholder, label }) => {
  const { data } = useEquipment(kind);
  const { data: admin } = useAdminPlayers();
  const rows = data?.rows ?? NO_ROWS;
  const brands = data?.brands ?? NO_BRANDS;
  const matchers = useMemo(() => brandMatchers(brands), [brands]);
  const order = useMemo(
    () => buildRows(admin?.players ?? NO_PLAYERS, matchers).brands.map((b) => b.value),
    [admin, matchers],
  );
  const tree = useMemo(() => catalogTree(rows, order), [rows, order]);
  const typed = value.trim();
  const path = useMemo(() => catalogPath(rows, typed), [rows, typed]);
  const unknown = !!data && !!typed && !path;
  const onPick = useCallback((next: string[] | null) => onChange(next?.at(-1) ?? ''), [onChange]);

  return (
    <div className={classes.root}>
      <Cascader
        aria-label={label}
        data={tree}
        value={path}
        onChange={onPick}
        placeholder={unknown ? typed : placeholder}
        searchable
        filter={catalogSearch}
        formatValue={formatName}
        expandTrigger="hover"
        columnWidth={COLUMN_WIDTH}
        maxDropdownHeight={DROPDOWN_HEIGHT}
        nothingFoundMessage="Not in the catalog"
        comboboxProps={COMBOBOX_PROPS}
        clearable
        classNames={INPUT_CLASSES}
      />
      {unknown && (
        <span className={classes.unknown}>
          “{typed}” isn’t in the catalog
          <button type="button" className={classes.cancel} onClick={() => onChange('')}>
            Clear
          </button>
        </span>
      )}
      <AddToCatalog key={typed} kind={kind} value={unknown ? typed : ''} brands={brands} onAdded={onChange} />
    </div>
  );
});
