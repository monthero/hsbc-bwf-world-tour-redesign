import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, type CSSProperties, type FC, type ReactNode } from 'react';

import { FilterChip, IconBack, PageHeader, Segmented, StickyBar } from '~/components/ui';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';

import {
  DESKTOP_COLUMNS,
  DESKTOP_WIDTHS,
  MOBILE_WIDTH,
  STUDY_GRID_GAP,
  type DesktopWidth,
  type StudyOption,
} from './study';

import classes from './StudyLayout.module.css';
import utils from '~/styles/utils.module.css';

const BACK = (
  <Link to="/study-cases" className={clsx(utils.link, classes.back)}>
    <IconBack size={14} />
    Study cases
  </Link>
);

export const StudyShell: FC<{
  title: string;
  meta: string;
  width: DesktopWidth;
  onWidth: (w: DesktopWidth) => void;
  controls?: ReactNode;
  children: ReactNode;
}> = ({ title, meta, width, onWidth, controls, children }) => {
  useDocumentTitle([title, 'Study cases'], 'bwf');
  const onChange = useCallback((w: DesktopWidth | null) => w && onWidth(w), [onWidth]);
  return (
    <div className={classes.page}>
      <PageHeader kicker={BACK} title={title} meta={meta} />
      <StickyBar glass className={classes.bar}>
        <div className={clsx(utils.container, classes.controls)}>
          <div className={clsx(utils.noScrollbar, classes.chips)}>{controls}</div>
          <Segmented options={DESKTOP_WIDTHS} value={width} onChange={onChange} height={32} maxWidth={280} />
        </div>
      </StickyBar>
      <div className={clsx(utils.container, classes.variants)}>{children}</div>
    </div>
  );
};

const OptionChip = memo<{ option: StudyOption; active: boolean; onSelect: (key: string) => void }>(
  ({ option: o, active, onSelect }) => (
    <FilterChip size="sm" active={active} onClick={() => onSelect(o.key)}>
      {o.label}
    </FilterChip>
  ),
);

export const StudyOptions = memo<{ options: readonly StudyOption[]; value: string; onChange: (key: string) => void }>(
  ({ options, value, onChange }) =>
    options.map((o) => <OptionChip key={o.key} option={o} active={o.key === value} onSelect={onChange} />),
);

const Frame: FC<{ label: string; width: number; cols?: number; device?: boolean; children: ReactNode }> = ({
  label,
  width,
  cols = 1,
  device,
  children,
}) => (
  <figure className={classes.frame} style={{ '--w': `${width}px`, '--study-cols': cols } as CSSProperties}>
    <figcaption className={classes.caption}>{label}</figcaption>
    <div className={classes.screen} data-device={device || undefined}>
      {children}
    </div>
  </figure>
);

export const StudyVariant: FC<{
  title: string;
  points: readonly string[];
  width: DesktopWidth;
  grid?: boolean;
  render: () => ReactNode;
}> = ({ title, points, width, grid, render }) => {
  const cols = grid ? DESKTOP_COLUMNS[width] : 1;
  return (
    <section className={classes.variant} data-grid={grid || undefined}>
      <header className={classes.intro}>
        <h2 className={classes.title}>{title}</h2>
        <ul className={classes.points}>
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </header>
      <div className={classes.frames}>
        <Frame
          label={grid ? `Desktop · ${cols} × ${width}px cards` : `Desktop · ${width}px card`}
          width={cols * Number(width) + (cols - 1) * STUDY_GRID_GAP}
          cols={cols}
        >
          {render()}
        </Frame>
        <Frame label={`Mobile · ${MOBILE_WIDTH}px screen`} width={MOBILE_WIDTH} device>
          {render()}
        </Frame>
      </div>
    </section>
  );
};
