import { Trans, useLingui } from '@lingui/react/macro';
import { useMediaQuery } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';

import { LogoTile } from '~/components/tournament';
import { IconButton, IconNext, IconSettings, ShuttleIcon } from '~/components/ui';
import { useLiveAndNext } from '~/hooks/useTournaments';
import { DARK_SCOPE_PROPS } from '~/theme';
import type { Tournament } from '~/types';
import { isLive, tournamentLink } from '~/utils/tournaments';

import { DevLinks } from '../DevLinks';
import { SOCIAL_LINKS } from '../links';
import { SocialLinks } from '../SiteLink';
import { SettingsSheet } from '../SiteSettings';
import { COURT_LINES } from './lines';
import { useSectionActive } from './location';
import { MenuButton } from './MenuButton';
import { NAV_ITEMS, type NavItem } from './nav';
import { StatusKicker } from './StatusKicker';
import { useNavMenu } from './useNavMenu';

import classes from './CourtMenu.module.css';
import utils from '~/styles/utils.module.css';

const DESKTOP_QUERY = '(min-width: 62em)';

const BOX_AREAS = ['2 / 2', '2 / 3', '5 / 2', '5 / 3'];

const BOX_STYLES = NAV_ITEMS.map((_, i) => ({ gridArea: BOX_AREAS[i], '--i': i }) as CSSProperties);

const FAR = NAV_ITEMS.slice(0, 2);
const NEAR = NAV_ITEMS.slice(2);

const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  }, [locked]);
};

const useTopBelowHeader = (open: boolean, triggerId: string, dialog: HTMLElement | null) => {
  useLayoutEffect(() => {
    if (!open || !dialog) return;
    const measure = () => {
      const header = document.getElementById(triggerId)?.closest('header');
      if (!header) return;
      const top = header.getBoundingClientRect().bottom - dialog.getBoundingClientRect().top;
      dialog.style.setProperty('--menu-top', `${Math.max(0, top)}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, triggerId, dialog]);
};

const Box = memo<{ entry: NavItem; index: number; onNavigate: () => void }>(({ entry, index, onNavigate }) => {
  const active = useSectionActive(entry.item);
  const { i18n } = useLingui();
  const Glyph = entry.glyph;
  return (
    <Link
      to={entry.item.to}
      className={clsx(utils.link, classes.box)}
      style={BOX_STYLES[index]}
      data-active={active || undefined}
      data-autofocus={index === 0 || undefined}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
    >
      <span className={classes.top}>
        <Glyph size={28} className={classes.glyph} />
        <span className={classes.marks}>
          {active && <ShuttleIcon className={classes.shuttle} />}
          <span className={classes.index}>{entry.index}</span>
        </span>
      </span>
      <span className={classes.label}>{i18n._(entry.item.label)}</span>
      <span className={classes.blurb}>{i18n._(entry.blurb)}</span>
    </Link>
  );
});

const NetCard = memo<{ tournament: Tournament; onNavigate: () => void }>(({ tournament: t, onNavigate }) => (
  <Link
    {...tournamentLink(t)}
    className={clsx(utils.link, classes.card)}
    data-live={isLive(t) || undefined}
    onClick={onNavigate}
  >
    <LogoTile src={t.logo} size={36} name={t.name} className={classes.logo} />
    <span className={classes.cardBody}>
      <StatusKicker tournament={t} />
      <span className={clsx(utils.ellipsis, utils.bidiAuto, classes.name)}>{t.heading}</span>
    </span>
    <IconNext size={18} className={classes.arrow} />
  </Link>
));

const Court = memo<{ onNavigate: () => void }>(({ onNavigate }) => {
  const { live, next } = useLiveAndNext();
  const spot = live ?? next;
  const { t } = useLingui();
  return (
    <div className={classes.court}>
      <nav
        aria-label={t({ message: 'Main', comment: 'Accessible name of the main site navigation' })}
        className={classes.surface}
      >
        {COURT_LINES.map((l) => (
          <span key={l.id} className={classes.line} data-dir={l.dir} style={l.style} />
        ))}
        <span className={classes.net} />
        {FAR.map((m, i) => (
          <Box key={m.item.to} entry={m} index={i} onNavigate={onNavigate} />
        ))}
        {spot && <NetCard tournament={spot} onNavigate={onNavigate} />}
        {NEAR.map((m, i) => (
          <Box key={m.item.to} entry={m} index={i + FAR.length} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
});

export const CourtMenu = memo<{ defaultOpen?: boolean; contained?: boolean; className?: string }>(
  ({ defaultOpen, contained, className }) => {
    const { open, modal, id, triggerId, trap, toggle, close } = useNavMenu(defaultOpen);
    const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
    const [settings, setSettings] = useState(false);
    const desktop = useMediaQuery(DESKTOP_QUERY);
    const { t } = useLingui();
    useScrollLock(modal && !contained && !desktop);
    useTopBelowHeader(open, triggerId, dialog);

    const openSettings = useCallback(() => {
      close();
      setSettings(true);
    }, [close]);
    const closeSettings = useCallback(() => {
      setSettings(false);
      document.getElementById(triggerId)?.focus();
    }, [triggerId]);

    return (
      <div ref={trap} className={classes.scope} {...DARK_SCOPE_PROPS}>
        <MenuButton
          id={triggerId}
          controls={id}
          open={open}
          onClick={toggle}
          className={clsx(classes.button, className)}
          contained={contained}
        />
        <dialog
          open
          ref={setDialog}
          id={id}
          aria-modal={modal || undefined}
          aria-label={t({ message: 'Menu', comment: 'Accessible name of the site navigation menu' })}
          className={classes.overlay}
          data-shown={open || undefined}
          data-contained={contained || undefined}
          inert={!open}
        >
          <div className={classes.panel}>
            <Court onNavigate={close} />
            <div className={classes.foot}>
              <div className={classes.footHead}>
                <span className={classes.footLabel}>
                  <Trans comment="Menu heading above BWF social media links">Follow BWF</Trans>
                </span>
                <span className={classes.footActions}>
                  <DevLinks variant="ghost" buttonClassName={classes.settings} onNavigate={close} />
                  <IconButton label={t`Settings`} className={classes.settings} onClick={openSettings}>
                    <IconSettings size={18} />
                  </IconButton>
                </span>
              </div>
              <SocialLinks items={SOCIAL_LINKS} className={classes.social} />
            </div>
          </div>
        </dialog>
        <SettingsSheet opened={settings} onClose={closeSettings} />
      </div>
    );
  },
);
