import { Button, Popover, Switch } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useState, type ChangeEvent, type FC, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  BottomSheet,
  Eyebrow,
  IconButton,
  IconClose,
  IconSettings,
  Segmented,
  type SegmentedOption,
} from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import {
  useSettings,
  useSettingsChanged,
  type ClockMode,
  type HeightUnit,
  type SettingsData,
  type TimeZoneMode,
} from '~/stores/settings';
import { dayjs } from '~/utils/dates';

import classes from './SiteSettings.module.css';
import utils from '~/styles/utils.module.css';

type PanelVariant = 'popover' | 'sheet';

const LABEL = 'Settings';
const SEGMENT_HEIGHT: Record<PanelVariant, number> = { popover: 30, sheet: 38 };
const DROPDOWN_TRANSITION = { transition: 'pop-top-right', duration: 160 } as const;
const BROWSER_ZONE = dayjs.tz.guess().replaceAll('_', ' ');
const ZONE_HINT = `My time uses your browser’s time zone (${BROWSER_ZONE}).`;
const BLOCKED_HINT = 'When on, they appear greyed out. When off, they’re hidden from video lists and Watch buttons.';
const SWITCH_CLASSES = {
  body: classes.switchBody,
  labelWrapper: classes.switchText,
  label: classes.label,
  description: classes.hint,
};

const TIME_ZONE_OPTIONS: SegmentedOption<TimeZoneMode>[] = [
  { value: 'venue', label: 'Venue time' },
  { value: 'mine', label: 'My time' },
];
const CLOCK_OPTIONS: SegmentedOption<ClockMode>[] = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour' },
];
const HEIGHT_OPTIONS: SegmentedOption<HeightUnit>[] = [
  { value: 'cm', label: 'cm' },
  { value: 'ftin', label: 'ft & in' },
];

const patch = (p: Partial<SettingsData>) => useSettings.getState().set(p);
const reset = () => useSettings.getState().reset();
const onTimeZone = (v: TimeZoneMode | null) => v && patch({ timeZone: v });
const onClock = (v: ClockMode | null) => v && patch({ clock: v });
const onHeight = (v: HeightUnit | null) => v && patch({ height: v });
const onShowBlocked = (e: ChangeEvent<HTMLInputElement>) => patch({ showBlocked: e.currentTarget.checked });

const Field: FC<{ label: string; hint?: string; children: ReactNode }> = ({ label, hint, children }) => (
  <div className={classes.field}>
    <span className={classes.label}>{label}</span>
    {children}
    {hint && <p className={classes.hint}>{hint}</p>}
  </div>
);

const Section: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <section className={classes.section}>
    <Eyebrow>{title}</Eyebrow>
    {children}
  </section>
);

const SettingsPanel = memo<{ variant: PanelVariant; onClose?: () => void }>(({ variant, onClose }) => {
  const { timeZone, clock, height, showBlocked } = useSettings(
    useShallow((s) => ({ timeZone: s.timeZone, clock: s.clock, height: s.height, showBlocked: s.showBlocked })),
  );
  const changed = useSettingsChanged();
  const h = SEGMENT_HEIGHT[variant];
  return (
    <div className={classes.panel} data-variant={variant}>
      <div className={classes.head}>
        <span className={classes.title}>{LABEL}</span>
        {onClose && (
          <IconButton label="Close settings" variant="ghost" onClick={onClose}>
            <IconClose size={18} />
          </IconButton>
        )}
      </div>
      <Section title="Times">
        <Field label="Show times in" hint={ZONE_HINT}>
          <Segmented options={TIME_ZONE_OPTIONS} value={timeZone} onChange={onTimeZone} height={h} />
        </Field>
        <Field label="Clock">
          <Segmented options={CLOCK_OPTIONS} value={clock} onChange={onClock} height={h} />
        </Field>
      </Section>
      <Section title="Units">
        <Field label="Player height">
          <Segmented options={HEIGHT_OPTIONS} value={height} onChange={onHeight} height={h} />
        </Field>
      </Section>
      <Section title="Videos">
        <Switch
          checked={showBlocked}
          onChange={onShowBlocked}
          label="Show streams not available in my region"
          description={BLOCKED_HINT}
          labelPosition="left"
          size={variant === 'sheet' ? 'md' : 'sm'}
          classNames={SWITCH_CLASSES}
        />
      </Section>
      <div className={classes.foot}>
        <Button variant="subtle" color="gray" size="compact-xs" disabled={!changed} onClick={reset}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
});

export const SettingsSheet = memo<{ opened: boolean; onClose: () => void }>(({ opened, onClose }) => (
  <BottomSheet opened={opened} onClose={onClose} handle bodyClassName={classes.sheetBody}>
    <SettingsPanel variant="sheet" onClose={onClose} />
  </BottomSheet>
));

export const SiteSettings = memo<{ className?: string }>(({ className }) => {
  const isMobile = useIsMobile();
  const [opened, setOpened] = useState(false);
  const toggle = useCallback(() => setOpened((o) => !o), []);
  const close = useCallback(() => setOpened(false), []);
  const trigger = (
    <IconButton label={LABEL} variant="brand" onClick={toggle} aria-expanded={opened} aria-haspopup="dialog">
      <IconSettings size={18} />
    </IconButton>
  );
  if (isMobile)
    return (
      <span className={className}>
        {trigger}
        <SettingsSheet opened={opened} onClose={close} />
      </span>
    );
  return (
    <span className={className}>
      <Popover
        opened={opened}
        onChange={setOpened}
        position="bottom-end"
        offset={10}
        width={340}
        transitionProps={DROPDOWN_TRANSITION}
        trapFocus
        returnFocus
        withinPortal
      >
        <Popover.Target>{trigger}</Popover.Target>
        <Popover.Dropdown className={clsx(utils.popover, classes.dropdown)} aria-label={LABEL}>
          <SettingsPanel variant="popover" />
        </Popover.Dropdown>
      </Popover>
    </span>
  );
});
