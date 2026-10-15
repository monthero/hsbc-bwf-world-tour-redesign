import { Button, FileButton } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { formatNumber, plural } from '~/utils/format';

import { useImportOverrides } from '../api';
import { planImport } from '../csv';
import { FIELD_BY_KEY, todayStamp } from '../fields';
import { CSV_FIELDS, CSV_ID, DEFAULT_SOURCE, type AdminPlayer, type Provenance } from '../schema';
import { AdminModal } from './AdminModal';
import { ChangePreview, PreviewSummary } from './ChangePreview';
import { ProvenanceInputs } from './FieldInputs';
import { exportedIn } from './inputs';
import { SaveStatus } from './SaveStatus';

import classes from './ImportCsv.module.css';
import parts from './ModalParts.module.css';
import utils from '~/styles/utils.module.css';

const ACCEPT = '.csv,text/csv';
const COLUMNS_HINT = `Rows are matched by ${CSV_ID}. Known columns: ${Object.keys(CSV_FIELDS).join(', ')}. Empty cells and values a player already has are skipped.`;

const skipped = (count: number, what: string) => (count ? [`${formatNumber(count)} ${what}`] : []);

const ImportFacts = memo<{ read: number; unknown: number; duplicates: number; invalid: number }>(
  ({ read, unknown, duplicates, invalid }) => (
    <p className={clsx(utils.num, classes.facts)}>
      {[
        `${plural(read, 'player')} read`,
        ...skipped(unknown, 'unknown ids'),
        ...skipped(duplicates, 'duplicate rows'),
        ...skipped(invalid, 'invalid values'),
      ].join(' · ')}
    </p>
  ),
);

export const ImportCsv: FC<{ opened: boolean; onClose: () => void; players: readonly AdminPlayer[] }> = ({
  opened,
  onClose,
  players,
}) => {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [provenance, setProvenance] = useState<Provenance>(() => ({ source: DEFAULT_SOURCE, asOf: todayStamp() }));
  const { mutate, isPending, error, data, reset } = useImportOverrides();
  const plan = useMemo(() => (file ? planImport(file.text, players) : null), [file, players]);
  const active = useMemo(() => plan?.fields.filter((f) => f.changes.length) ?? [], [plan]);

  const onFile = useCallback(
    (picked: File | null) => {
      reset();
      if (!picked) return setFile(null);
      void picked.text().then((text) => setFile({ name: picked.name, text }));
    },
    [reset],
  );
  const onClosed = useCallback(() => {
    reset();
    setFile(null);
    onClose();
  }, [reset, onClose]);
  const onApply = useCallback(() => {
    if (!plan?.rows.length) return;
    mutate({ rows: plan.rows, source: provenance.source.trim() || DEFAULT_SOURCE, asOf: provenance.asOf });
  }, [mutate, plan, provenance]);

  const count = plan?.rows.length ?? 0;
  return (
    <AdminModal
      opened={opened}
      onClose={onClosed}
      size={820}
      title={
        <div className={parts.title}>
          <h2 className={parts.heading}>Import CSV</h2>
          {file && <span className={clsx(utils.ellipsis, parts.sub)}>{file.name}</span>}
        </div>
      }
      actions={
        <Button radius="xl" onClick={onApply} disabled={!count || isPending} loading={isPending}>
          {count ? `Update ${plural(count, 'player')}` : 'Update'}
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
        <div className={classes.pick}>
          <FileButton onChange={onFile} accept={ACCEPT}>
            {(props) => (
              <Button variant="default" radius="xl" {...props}>
                {file ? 'Choose another file' : 'Choose CSV file'}
              </Button>
            )}
          </FileButton>
          <p className={classes.hint}>{COLUMNS_HINT}</p>
        </div>
        <ProvenanceInputs value={provenance} onChange={setProvenance} />
      </div>
      {plan?.error && <p className={classes.error}>{plan.error}</p>}
      {plan && !plan.error && (
        <>
          <ImportFacts read={plan.players} unknown={plan.unknown} duplicates={plan.duplicates} invalid={plan.invalid} />
          <PreviewSummary players={count} fields={active.length} />
          {active.map((f) => (
            <ChangePreview key={f.key} label={f.label} field={FIELD_BY_KEY.get(f.key)} changes={f.changes} />
          ))}
        </>
      )}
    </AdminModal>
  );
};
