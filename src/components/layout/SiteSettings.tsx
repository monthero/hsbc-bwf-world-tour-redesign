import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button, NativeSelect, Popover, Switch } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useState, type ChangeEvent, type FC, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { BottomSheet, Eyebrow, IconButton, IconClose, IconSettings, Segmented } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { isLocale, LOCALE_META, LOCALES } from '~/i18n/locales';
import { switchLocale } from '~/i18n/switch';
import { useLazyOptions, type LazyOption } from '~/i18n/useLazyOptions';
import {
  useSettings,
  useSettingsChanged,
  type ClockMode,
  type HeightUnit,
  type SettingsData,
  type TensionUnit,
  type TimeZoneMode,
} from '~/stores/settings';
import { dayjs } from '~/utils/dates';

import classes from './SiteSettings.module.css';
import utils from '~/styles/utils.module.css';

type PanelVariant = 'popover' | 'sheet';

const LABEL = msg`Settings`;
const SEGMENT_HEIGHT: Record<PanelVariant, number> = { popover: 30, sheet: 38 };
const DROPDOWN_TRANSITION = { transition: 'pop-top-right', duration: 160 } as const;
const BROWSER_ZONE = dayjs.tz.guess().replaceAll('_', ' ');
const SWITCH_CLASSES = {
  body: classes.switchBody,
  labelWrapper: classes.switchText,
  label: classes.label,
  description: classes.hint,
};

const LANGUAGE_OPTIONS = LOCALES.map((value) => ({ value, label: LOCALE_META[value].name }));

const TIME_ZONE_OPTIONS: LazyOption<TimeZoneMode>[] = [
  {
    value: 'venue',
    label: msg({
      message: 'Venue time',
      comment: 'Settings option: show match times in the tournament venue’s local time zone',
    }),
  },
  {
    value: 'mine',
    label: msg({ message: 'My time', comment: 'Settings option: show match times in the visitor’s own time zone' }),
  },
];
const CLOCK_OPTIONS: LazyOption<ClockMode>[] = [
  { value: '24h', label: msg`24-hour` },
  { value: '12h', label: msg`12-hour` },
];
const HEIGHT_OPTIONS: LazyOption<HeightUnit>[] = [
  { value: 'cm', label: 'cm' },
  {
    value: 'ftin',
    label: msg({ message: 'ft & in', comment: 'Settings option: show player heights in feet and inches' }),
  },
];
const TENSION_OPTIONS: LazyOption<TensionUnit>[] = [
  { value: 'lbs', label: 'lbs' },
  { value: 'kg', label: 'kg' },
];

const patch = (p: Partial<SettingsData>) => useSettings.getState().set(p);
const reset = () => useSettings.getState().reset();
const onTimeZone = (v: TimeZoneMode | null) => v && patch({ timeZone: v });
const onClock = (v: ClockMode | null) => v && patch({ clock: v });
const onHeight = (v: HeightUnit | null) => v && patch({ height: v });
const onTension = (v: TensionUnit | null) => v && patch({ tension: v });
const onShowBlocked = (e: ChangeEvent<HTMLInputElement>) => patch({ showBlocked: e.currentTarget.checked });
const onLanguage = (e: ChangeEvent<HTMLSelectElement>) => {
  const next = e.currentTarget.value;
  if (isLocale(next)) switchLocale(next);
};

const Field: FC<{ label: ReactNode; hint?: ReactNode; children: ReactNode }> = ({ label, hint, children }) => (
  <div className={classes.field}>
    <span className={classes.label}>{label}</span>
    {children}
    {hint && <p className={classes.hint}>{hint}</p>}
  </div>
);

const Section: FC<{ title: ReactNode; children: ReactNode }> = ({ title, children }) => (
  <section className={classes.section}>
    <Eyebrow>{title}</Eyebrow>
    {children}
  </section>
);

const SettingsPanel = memo<{ variant: PanelVariant; onClose?: () => void }>(({ variant, onClose }) => {
  const { timeZone, clock, height, tension, showBlocked } = useSettings(
    useShallow((s) => ({
      timeZone: s.timeZone,
      clock: s.clock,
      height: s.height,
      tension: s.tension,
      showBlocked: s.showBlocked,
    })),
  );
  const changed = useSettingsChanged();
  const { t, i18n } = useLingui();
  const timeZones = useLazyOptions(TIME_ZONE_OPTIONS);
  const clocks = useLazyOptions(CLOCK_OPTIONS);
  const heights = useLazyOptions(HEIGHT_OPTIONS);
  const tensions = useLazyOptions(TENSION_OPTIONS);
  const h = SEGMENT_HEIGHT[variant];
  const zone = BROWSER_ZONE;
  return (
    <div className={classes.panel} data-variant={variant}>
      <div className={classes.head}>
        <span className={classes.title}>{i18n._(LABEL)}</span>
        {onClose && (
          <IconButton label={t`Close settings`} variant="ghost" onClick={onClose}>
            <IconClose size={18} />
          </IconButton>
        )}
      </div>
      <Section title={<Trans>Language</Trans>}>
        <NativeSelect
          aria-label={t`Language`}
          data={LANGUAGE_OPTIONS}
          value={i18n.locale}
          onChange={onLanguage}
          size={variant === 'sheet' ? 'md' : 'sm'}
          radius="md"
        />
      </Section>
      <Section title={<Trans comment="Settings section heading for match time display options">Times</Trans>}>
        <Field
          label={<Trans comment="Settings label before the choice between venue time and my time">Show times in</Trans>}
          hint={<Trans>My time uses your browser’s time zone ({zone}).</Trans>}
        >
          <Segmented options={timeZones} value={timeZone} onChange={onTimeZone} height={h} />
        </Field>
        <Field label={<Trans comment="Settings label: choose a 12-hour or 24-hour clock">Clock</Trans>}>
          <Segmented options={clocks} value={clock} onChange={onClock} height={h} />
        </Field>
      </Section>
      <Section title={<Trans comment="Settings section heading for measurement units">Units</Trans>}>
        <Field label={<Trans>Player heights</Trans>}>
          <Segmented options={heights} value={height} onChange={onHeight} height={h} />
        </Field>
        <Field
          label={
            <Trans comment="Settings label: unit for badminton racket string tension (lbs or kg)">
              String tensions
            </Trans>
          }
        >
          <Segmented options={tensions} value={tension} onChange={onTension} height={h} />
        </Field>
      </Section>
      <Section title={<Trans comment="Settings section heading for video and live stream options">Videos</Trans>}>
        <Switch
          checked={showBlocked}
          onChange={onShowBlocked}
          label={<Trans>Show streams not available in my region</Trans>}
          description={
            <Trans>When on, they appear greyed out. When off, they’re hidden from video lists and Watch buttons.</Trans>
          }
          labelPosition="left"
          size={variant === 'sheet' ? 'md' : 'sm'}
          classNames={SWITCH_CLASSES}
        />
      </Section>
      <div className={classes.foot}>
        <Button variant="subtle" color="gray" size="compact-xs" disabled={!changed} onClick={reset}>
          <Trans>Reset to defaults</Trans>
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
  const { i18n } = useLingui();
  const label = i18n._(LABEL);
  const trigger = (
    <IconButton label={label} variant="brand" onClick={toggle} aria-expanded={opened} aria-haspopup="dialog">
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
        <Popover.Dropdown className={clsx(utils.popover, classes.dropdown)} aria-label={label}>
          <SettingsPanel variant="popover" />
        </Popover.Dropdown>
      </Popover>
    </span>
  );
});
