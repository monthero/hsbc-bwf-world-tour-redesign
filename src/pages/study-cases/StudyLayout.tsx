import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type FC,
  type ReactNode,
  type RefObject,
} from 'react';

import { FilterChip, IconBack, PageHeader, Segmented, StickyBar } from '~/components/ui';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { joinDots } from '~/utils/format';

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

const BAR_VAR = '--study-bar';

const useBarHeight = (bar: RefObject<HTMLDivElement | null>, host: RefObject<HTMLDivElement | null>) => {
  useLayoutEffect(() => {
    const el = bar.current;
    const target = host.current;
    if (!el || !target) return;
    const ro = new ResizeObserver(() => target.style.setProperty(BAR_VAR, `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, [bar, host]);
};

export const StudyShell: FC<{
  title: string;
  meta: string;
  width?: DesktopWidth;
  onWidth?: (w: DesktopWidth) => void;
  controls?: ReactNode;
  secondary?: ReactNode;
  aside?: ReactNode;
  bleed?: ReactNode;
  children: ReactNode;
}> = ({ title, meta, width, onWidth, controls, secondary, aside, bleed, children }) => {
  useDocumentMeta({ title: joinDots([title, 'Study cases']) });
  const page = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useBarHeight(bar, page);
  const onChange = useCallback((w: DesktopWidth | null) => w && onWidth?.(w), [onWidth]);
  return (
    <div ref={page} className={classes.page}>
      <PageHeader kicker={BACK} title={title} meta={meta} />
      <StickyBar ref={bar} glass className={classes.bar}>
        <div className={clsx(utils.container, classes.controls)}>
          <div className={clsx(utils.noScrollbar, classes.chips)}>{controls}</div>
          {aside}
          {width && <Segmented options={DESKTOP_WIDTHS} value={width} onChange={onChange} height={32} maxWidth={280} />}
        </div>
        {secondary && (
          <div className={clsx(utils.container, classes.secondary)}>
            <div className={clsx(utils.noScrollbar, classes.chips)}>{secondary}</div>
          </div>
        )}
      </StickyBar>
      <div className={clsx(utils.container, classes.variants)}>{children}</div>
      {bleed && <div className={classes.bleed}>{bleed}</div>}
    </div>
  );
};

const OptionChip = memo<{ option: StudyOption; active: boolean; onSelect: (key: string) => void }>(
  ({ option: o, active, onSelect }) => (
    <FilterChip size="sm" active={active} onClick={() => onSelect(o.key)}>
      {o.label}
      {o.hint && <span className={classes.hint}>{o.hint}</span>}
    </FilterChip>
  ),
);

export const StudyOptions = memo<{ options: readonly StudyOption[]; value: string; onChange: (key: string) => void }>(
  ({ options, value, onChange }) =>
    options.map((o) => <OptionChip key={o.key} option={o} active={o.key === value} onSelect={onChange} />),
);

const Frame: FC<{
  label: string;
  width: number;
  cols?: number;
  device?: boolean;
  flush?: boolean;
  children: ReactNode;
}> = ({ label, width, cols = 1, device, flush, children }) => (
  <figure className={classes.frame} style={{ '--w': `${width}px`, '--study-cols': cols } as CSSProperties}>
    <figcaption className={classes.caption}>{label}</figcaption>
    <div className={classes.screen} data-device={device || undefined} data-flush={flush || undefined}>
      {children}
    </div>
  </figure>
);

export const StudyIntro = memo<{ title: string; points: readonly string[]; className?: string }>(
  ({ title, points, className }) => (
    <header className={clsx(classes.intro, className)}>
      <h2 className={classes.title}>{title}</h2>
      <ul className={classes.points}>
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </header>
  ),
);

export const StudyVariant: FC<{
  title: string;
  points: readonly string[];
  width?: DesktopWidth;
  grid?: boolean;
  flush?: boolean;
  mobileWidth?: number;
  render: () => ReactNode;
}> = ({ title, points, width, grid, flush, mobileWidth = MOBILE_WIDTH, render }) => {
  const cols = grid && width ? DESKTOP_COLUMNS[width] : 1;
  return (
    <section className={classes.variant} data-grid={grid || undefined}>
      <StudyIntro title={title} points={points} />
      <div className={classes.frames}>
        {width && (
          <Frame
            label={grid ? `Desktop · ${cols} × ${width}px cards` : `Desktop · ${width}px card`}
            width={cols * Number(width) + (cols - 1) * STUDY_GRID_GAP}
            cols={cols}
          >
            {render()}
          </Frame>
        )}
        <Frame label={`Mobile · ${mobileWidth}px screen`} width={mobileWidth} device flush={flush}>
          {render()}
        </Frame>
      </div>
    </section>
  );
};
