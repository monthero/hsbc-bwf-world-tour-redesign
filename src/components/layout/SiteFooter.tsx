import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconGitHub } from '~/components/ui';
import { today } from '~/utils/dates';
import { localAsset } from '~/utils/images';

import { BwfMark } from './BwfMark';
import { BWF_HQ, FOOTER_GROUPS, itemKey, OFFICIAL_LEGAL, OFFICIAL_SITE, SOCIAL_LINKS, TITLE_PARTNER } from './links';
import { ExternalButton, ExternalLink, SiteLink, SocialLinks } from './SiteLink';
import { Wordmark } from './Wordmark';

import classes from './SiteFooter.module.css';
import utils from '~/styles/utils.module.css';

const YEAR = today().year();
const HSBC_LOGO = localAsset('/assets/brand/hsbc.svg');
const SOURCE_URL = 'https://github.com/monthero/hsbc-bwf-world-tour-redesign';

export const SiteFooter = memo(() => {
  const { t, i18n } = useLingui();
  return (
    <footer className={classes.footer}>
      <div className={clsx(utils.container, classes.grid)}>
        <section className={classes.about} aria-label={t`About this site`}>
          <Wordmark />
          <p className={classes.note}>
            <Trans>
              An <strong className={classes.unofficial}>unofficial</strong> redesign concept for the HSBC BWF World Tour
              section of the BWF website. Not affiliated with, endorsed by or operated by the Badminton World Federation
              (BWF) or HSBC. Data may be incomplete, delayed or inaccurate.
            </Trans>
          </p>
          <ExternalButton item={OFFICIAL_SITE} />
          <SocialLinks items={SOCIAL_LINKS} size="md" className={classes.social} />
        </section>
        {FOOTER_GROUPS.map((g) => {
          const label = i18n._(g.label);
          return (
            <nav key={label} className={classes.group} aria-label={label}>
              <h2 className={classes.heading}>{label}</h2>
              <ul className={classes.list}>
                {g.items.map((it) => (
                  <li key={itemKey(it)}>
                    <SiteLink item={it} className={classes.link} />
                  </li>
                ))}
              </ul>
            </nav>
          );
        })}
        <section className={clsx(classes.group, classes.hq)} aria-label={t`BWF headquarters`}>
          <h2 className={classes.heading}>
            <Trans>BWF headquarters</Trans>
          </h2>
          <address className={classes.address}>
            {BWF_HQ.lines.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </address>
          <ExternalLink item={BWF_HQ.contact} className={classes.link} />
        </section>
      </div>
      <div className={clsx(utils.container, classes.bottom)}>
        <p className={classes.copy}>
          <Trans comment="Footer copyright line; {YEAR} is the current year">
            © {YEAR} Tournament data, results, images and logos belong to the Badminton World Federation, the players
            and their respective rights holders.
          </Trans>
        </p>
        <ul className={classes.legal}>
          {OFFICIAL_LEGAL.map((it) => (
            <li key={it.href}>
              <ExternalLink item={it} className={classes.link} />
            </li>
          ))}
        </ul>
      </div>
      <div className={classes.partners}>
        <div className={clsx(utils.container, classes.partnersInner)}>
          <a
            href={TITLE_PARTNER.href}
            target="_blank"
            rel="noreferrer"
            className={classes.partnerLogo}
            aria-label={t`HSBC, World Tour title partner (opens in a new tab)`}
          >
            <img src={HSBC_LOGO} alt="" width={120} height={40} className={classes.hsbc} />
          </a>
          <BwfMark className={classes.bwf} />
        </div>
      </div>
      <div className={classes.fan}>
        <div className={clsx(utils.container, classes.fanInner)}>
          <p className={classes.fanNote}>
            <Trans comment="Small print on the last row of the site footer, beside the GitHub source link">
              <strong className={classes.unofficial}>Unofficial and non-commercial.</strong> Built by a badminton fan,
              for badminton fans.
            </Trans>
          </p>
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className={clsx(classes.link, classes.source)}>
            <IconGitHub size={18} />
            <Trans comment="Footer link to the site’s source code on GitHub, inviting people to send feedback or contribute">
              Open source on GitHub. Feedback, ideas and contributions welcome
            </Trans>
            <VisuallyHidden>
              <Trans>(opens in a new tab)</Trans>
            </VisuallyHidden>
          </a>
        </div>
      </div>
    </footer>
  );
});
