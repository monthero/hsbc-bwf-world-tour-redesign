import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { FC } from 'react';

import { localAsset } from '~/utils/images';

import classes from './Wordmark.module.css';

const LOGO = localAsset('/assets/brand/logo-wt-white.svg');

export const Wordmark: FC<{ onNavigate?: () => void; className?: string }> = ({ onNavigate, className }) => {
  const { t } = useLingui();
  return (
    <Link
      to="/"
      className={clsx(classes.wordmark, className)}
      onClick={onNavigate}
      aria-label={t({
        message: 'HSBC BWF World Tour concept, home',
        comment:
          'Accessible name of the site logo, which links to the home page. “Concept” means this is a redesign concept',
      })}
    >
      <img src={LOGO} alt="" className={classes.logo} width={151} height={46} />
      <span className={classes.tag}>
        <Trans comment="Small tag beside the site logo: this site is an unofficial redesign concept">Concept</Trans>
      </span>
    </Link>
  );
};
