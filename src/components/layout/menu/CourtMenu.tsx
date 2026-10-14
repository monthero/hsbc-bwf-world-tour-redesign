import { useMediaQuery } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';

import { LogoTile } from '~/components/tournament';
import { IconNext, IconSettings, ShuttleIcon } from '~/components/ui';
import { useLiveAndNext } from '~/hooks/useTournaments';
import type { Tournament } from '~/types';
import { isLive, tournamentLink } from '~/utils/tournaments';

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
      <span className={classes.label}>{entry.item.label}</span>
      <span className={classes.blurb}>{entry.blurb}</span>
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
      <span className={clsx(utils.ellipsis, classes.name)}>{t.heading}</span>
    </span>
    <IconNext size={18} className={classes.arrow} />
  </Link>
));

const Court = memo<{ onNavigate: () => void }>(({ onNavigate }) => {
  const { live, next } = useLiveAndNext();
  const spot = live ?? next;
  return (
    <div className={classes.court}>
      <nav aria-label="Main" className={classes.surface}>
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
      <div ref={trap} className={classes.scope}>
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
          aria-label="Menu"
          className={classes.overlay}
          data-shown={open || undefined}
          data-contained={contained || undefined}
          inert={!open}
        >
          <div className={classes.panel}>
            <Court onNavigate={close} />
            <div className={classes.foot}>
              <div className={classes.footHead}>
                <span className={classes.footLabel}>Follow BWF</span>
                <button type="button" className={classes.settings} onClick={openSettings}>
                  <IconSettings size={16} />
                  Settings
                </button>
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
