import { Trans, useLingui } from '@lingui/react/macro';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { BottomSheet, FloatingPill, IconFilters } from '~/components/ui';
import type { TournamentDay } from '~/types';

import { ClearButton, CourtChips, DaySegment, Divider, EventChips, FilterSearch, FollowToggle } from './FilterControls';
import type { MatchFilters } from './useMatchFilters';
import type { MatchesView } from './utils';

import classes from './FilterBars.module.css';
import utils from '~/styles/utils.module.css';

const PillDay: FC<{ day: TournamentDay }> = ({ day: { shortLabel: day, month } }) => (
  <span>
    <Trans comment="Selected day on the phone filters button, e.g. “Wed 15 Oct”. {day} is the weekday and day number, {month} the short month">
      {day} {month}
    </Trans>
  </span>
);

interface BarProps {
  filters: MatchFilters;
  view: MatchesView;
}

export const InlineFilters = memo<BarProps & { ref: (el: HTMLDivElement | null) => void }>(
  ({ filters: f, view, ref }) => {
    return (
      <div ref={ref} className={classes.inline}>
        <EventChips className={classes.inlineChips} variant="inline" chips={view.evChips} onToggle={f.toggleEvent} />
        {view.courtChips.length > 0 && (
          <>
            <Divider fade className={classes.desktopOnly} />
            <CourtChips
              className={classes.inlineChips}
              variant="inline"
              chips={view.courtChips}
              onToggle={f.toggleCourt}
            />
          </>
        )}
        {f.hasFilters && <ClearButton variant="inline" onClick={f.clear} />}
        <div className={classes.searchWrap}>
          <FilterSearch variant="inline" value={f.q} onChange={f.setQ} />
          <FollowToggle variant="inline" active={f.following} onToggle={f.toggleFollowing} />
        </div>
      </div>
    );
  },
);

export const CondensedFilters = memo<BarProps & { days: TournamentDay[]; visible: boolean }>(
  ({ filters: f, view, days, visible }) => {
    return (
      <div className={classes.anchor}>
        <div className={clsx(utils.glass, classes.condensed)} data-visible={visible || undefined} inert={!visible}>
          <div className={clsx(utils.container, classes.condensedRow)}>
            <DaySegment variant="compact" days={days} day={f.day} onChange={f.setDay} />
            <Divider />
            <EventChips variant="compact" chips={view.evChips} onToggle={f.toggleEvent} />
            {view.courtChips.length > 0 && (
              <>
                <Divider fade />
                <CourtChips variant="compact" chips={view.courtChips} onToggle={f.toggleCourt} />
              </>
            )}
            {f.hasFilters && <ClearButton variant="compact" onClick={f.clear} />}
            <FilterSearch variant="compact" value={f.q} onChange={f.setQ} />
            <FollowToggle variant="compact" active={f.following} onToggle={f.toggleFollowing} />
          </div>
        </div>
      </div>
    );
  },
);

export const MobileFilters = memo<BarProps & { days: TournamentDay[]; visible: boolean }>(
  ({ filters: f, view, days, visible }) => {
    const { t } = useLingui();
    const [open, { open: show, close }] = useDisclosure(false);
    const d = days[f.day];
    const filters = t({ message: 'Filters', comment: 'Button and sheet title for the match filters on phones' });
    return (
      <>
        <FloatingPill visible={visible && !open} onClick={show} label={filters} mobileOnly>
          <IconFilters size={16} />
          {d && <PillDay day={d} />}
          {f.count > 0 && <span className={classes.pillCount}>{f.count}</span>}
        </FloatingPill>
        <BottomSheet opened={open} onClose={close} handle bodyClassName={classes.sheetBody}>
          <div className={classes.sheetHead}>
            <span className={classes.sheetTitle}>{filters}</span>
            {f.hasFilters && <ClearButton variant="sheet" onClick={f.clear} />}
          </div>
          <div className={classes.field}>
            <span className={classes.label}>
              <Trans comment="Match filters: label above the tournament day picker">Day</Trans>
            </span>
            <DaySegment variant="sheet" days={days} day={f.day} onChange={f.setDay} />
          </div>
          <div className={classes.field}>
            <span className={classes.label}>
              <Trans comment="Match filters: label above the event chips (MS, WS, MD, WD, XD)">Category</Trans>
            </span>
            <EventChips variant="sheet" chips={view.evChips} onToggle={f.toggleEvent} />
          </div>
          {view.courtChips.length > 0 && (
            <div className={classes.field}>
              <span className={classes.label}>
                <Trans comment="Match filters: label above the court number chips">Court</Trans>
              </span>
              <CourtChips variant="sheet" chips={view.courtChips} onToggle={f.toggleCourt} />
            </div>
          )}
          <div className={classes.searchRow}>
            <FilterSearch variant="sheet" value={f.q} onChange={f.setQ} />
            <FollowToggle variant="sheet" active={f.following} onToggle={f.toggleFollowing} />
          </div>
          <button type="button" className={classes.done} onClick={close}>
            <Trans comment="Button that closes the match filters sheet">Done</Trans>
          </button>
        </BottomSheet>
      </>
    );
  },
);
