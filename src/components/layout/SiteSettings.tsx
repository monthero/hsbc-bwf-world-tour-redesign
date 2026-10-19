import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button, NativeSelect, Popover, Switch, VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useId, useMemo, useState, type ChangeEvent, type FC, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  BottomSheet,
  IconAppearance,
  IconButton,
  IconClock,
  IconClose,
  IconDark,
  IconInstall,
  IconLight,
  IconReset,
  IconRuler,
  IconSettings,
  IconSystemScheme,
  IconTension,
  IconTranslate,
  Segmented,
  Tip,
  type SegmentedOption,
} from '~/components/ui';
import { useInstallApp } from '~/hooks/useInstallApp';
import { useIsMobile } from '~/hooks/useIsMobile';
import { currentLocale } from '~/i18n/current';
import { intlLocale, isLocale, LOCALE_META, LOCALES } from '~/i18n/locales';
import { switchLocale } from '~/i18n/switch';
import { useLazyOptions, type LazyOption } from '~/i18n/useLazyOptions';
import {
  useSettings,
  useSettingsChanged,
  type ClockMode,
  type ColorScheme,
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
const LANGUAGE = msg`Language`;
const APPEARANCE = msg({
  message: 'Theme',
  comment: 'Settings label: choose a light, dark or system colour theme for the site',
});
const CLOCK = msg({ message: 'Clock', comment: 'Settings label: choose a 12-hour or 24-hour clock' });
const HEIGHTS = msg`Player heights`;
const TENSIONS = msg({
  message: 'String tensions',
  comment: 'Settings label: unit for badminton racket string tension (lbs or kg)',
});
const RESET = msg`Reset to defaults`;
const SEGMENT_HEIGHT: Record<PanelVariant, number> = { popover: 30, sheet: 38 };
const ICON_SIZE: Record<PanelVariant, number> = { popover: 18, sheet: 20 };
const DROPDOWN_TRANSITION = { transition: 'pop-top-right', duration: 160 } as const;
const BROWSER_ZONE = dayjs.tz.guess().replaceAll('_', ' ');
const SAMPLE_TIME = new Date(2000, 0, 1, 13);
const SAMPLE_CM = 185;
const SAMPLE_FT = [6, 1] as const;
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
const COLOR_SCHEME_OPTIONS: LazyOption<ColorScheme>[] = [
  {
    value: 'light',
    label: msg({ message: 'Light', comment: 'Settings option: light colour theme' }),
    icon: <IconLight size={14} />,
  },
  {
    value: 'dark',
    label: msg({ message: 'Dark', comment: 'Settings option: dark colour theme' }),
    icon: <IconDark size={14} />,
  },
  {
    value: 'auto',
    label: msg({
      message: 'System',
      comment: 'Settings option: follow the light or dark theme set on the visitor’s device',
    }),
    icon: <IconSystemScheme size={14} />,
  },
];
const CLOCK_MODES: { value: ClockMode; hourCycle: Intl.DateTimeFormatOptions['hourCycle']; name: ReactNode }[] = [
  { value: '24h', hourCycle: 'h23', name: <Trans>24-hour clock</Trans> },
  { value: '12h', hourCycle: 'h12', name: <Trans>12-hour clock</Trans> },
];
const TENSION_OPTIONS: LazyOption<TensionUnit>[] = [
  { value: 'lbs', label: 'lbs' },
  { value: 'kg', label: 'kg' },
];

const clockOptions = (tag: string): SegmentedOption<ClockMode>[] =>
  CLOCK_MODES.map(({ value, hourCycle, name }) => ({
    value,
    label: new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit', hourCycle }).format(SAMPLE_TIME),
    badge: <VisuallyHidden> {name}</VisuallyHidden>,
  }));

const heightOptions = (tag: string): SegmentedOption<HeightUnit>[] => {
  const nf = new Intl.NumberFormat(tag);
  return [
    { value: 'cm', label: `${nf.format(SAMPLE_CM)} cm` },
    { value: 'ftin', label: `${nf.format(SAMPLE_FT[0])}′${nf.format(SAMPLE_FT[1])}″` },
  ];
};

const patch = (p: Partial<SettingsData>) => useSettings.getState().set(p);
const reset = () => useSettings.getState().reset();
const onColorScheme = (v: ColorScheme | null) => v && patch({ colorScheme: v });
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

const IconRow: FC<{ icon: ReactNode; label: string; children: ReactNode }> = ({ icon, label, children }) => {
  const id = useId();
  return (
    <fieldset className={classes.row} aria-labelledby={id}>
      <Tip label={label}>
        <span className={classes.rowIcon}>
          {icon}
          <VisuallyHidden id={id}>{label}</VisuallyHidden>
        </span>
      </Tip>
      {children}
    </fieldset>
  );
};

const InstallSection = memo<{ variant: PanelVariant }>(({ variant }) => {
  const { mode, install } = useInstallApp();
  if (!mode) return null;
  return (
    <section className={classes.section}>
      <Field
        label={
          <Trans comment="Settings label above the button that installs the site as an app on the device">App</Trans>
        }
        hint={
          mode === 'share' ? (
            <Trans comment="Hint under the install button on iPhone and iPad: the Share sheet opens and the visitor picks Add to Home Screen (use the exact name of that option in iOS in this language)">
              In the Share menu, choose “Add to Home Screen”.
            </Trans>
          ) : (
            <Trans comment="Hint under the install button on Android and desktop browsers">
              Opens the tour like an app, from your home screen.
            </Trans>
          )
        }
      >
        <Button
          variant="default"
          radius="xl"
          size={variant === 'sheet' ? 'md' : 'sm'}
          leftSection={<IconInstall size={16} />}
          onClick={install}
        >
          <Trans comment="Settings button that installs the site as an app (Android/desktop) or opens the Share menu (iPhone)">
            Install app
          </Trans>
        </Button>
      </Field>
    </section>
  );
});

const SettingsPanel = memo<{ variant: PanelVariant; onClose?: () => void }>(({ variant, onClose }) => {
  const { colorScheme, timeZone, clock, height, tension, showBlocked } = useSettings(
    useShallow((s) => ({
      colorScheme: s.colorScheme,
      timeZone: s.timeZone,
      clock: s.clock,
      height: s.height,
      tension: s.tension,
      showBlocked: s.showBlocked,
    })),
  );
  const changed = useSettingsChanged();
  const { t, i18n } = useLingui();
  const tag = intlLocale(currentLocale());
  const schemes = useLazyOptions(COLOR_SCHEME_OPTIONS);
  const timeZones = useLazyOptions(TIME_ZONE_OPTIONS);
  const clocks = useMemo(() => clockOptions(tag), [tag]);
  const heights = useMemo(() => heightOptions(tag), [tag]);
  const tensions = useLazyOptions(TENSION_OPTIONS);
  const h = SEGMENT_HEIGHT[variant];
  const size = ICON_SIZE[variant];
  const zone = BROWSER_ZONE;
  const language = i18n._(LANGUAGE);
  const resetLabel = i18n._(RESET);
  return (
    <div className={classes.panel} data-variant={variant}>
      <div className={classes.head}>
        <span className={classes.title}>{i18n._(LABEL)}</span>
        <span className={classes.actions}>
          <IconButton label={resetLabel} tip={resetLabel} variant="ghost" disabled={!changed} onClick={reset}>
            <IconReset size={18} />
          </IconButton>
          {onClose && (
            <IconButton label={t`Close settings`} variant="ghost" onClick={onClose}>
              <IconClose size={18} />
            </IconButton>
          )}
        </span>
      </div>
      <section className={classes.section}>
        <IconRow icon={<IconTranslate size={size} />} label={language}>
          <NativeSelect
            aria-label={language}
            data={LANGUAGE_OPTIONS}
            value={i18n.locale}
            onChange={onLanguage}
            size={variant === 'sheet' ? 'md' : 'sm'}
            radius="md"
            className={classes.grow}
          />
        </IconRow>
        <IconRow icon={<IconAppearance size={size} />} label={i18n._(APPEARANCE)}>
          <Segmented
            options={schemes}
            value={colorScheme}
            onChange={onColorScheme}
            height={h}
            className={classes.grow}
          />
        </IconRow>
      </section>
      <section className={classes.section}>
        <Field
          label={<Trans comment="Settings label before the choice between venue time and my time">Show times in</Trans>}
          hint={<Trans>My time uses your browser’s time zone ({zone}).</Trans>}
        >
          <Segmented options={timeZones} value={timeZone} onChange={onTimeZone} height={h} />
        </Field>
        <IconRow icon={<IconClock size={size} />} label={i18n._(CLOCK)}>
          <Segmented options={clocks} value={clock} onChange={onClock} height={h} className={classes.grow} />
        </IconRow>
      </section>
      <section className={classes.section}>
        <IconRow icon={<IconRuler size={size} />} label={i18n._(HEIGHTS)}>
          <Segmented options={heights} value={height} onChange={onHeight} height={h} className={classes.grow} />
        </IconRow>
        <IconRow icon={<IconTension size={size} />} label={i18n._(TENSIONS)}>
          <Segmented options={tensions} value={tension} onChange={onTension} height={h} className={classes.grow} />
        </IconRow>
      </section>
      <section className={classes.section}>
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
      </section>
      <InstallSection variant={variant} />
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
