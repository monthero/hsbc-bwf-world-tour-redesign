import { clsx } from 'clsx';
import { memo, useLayoutEffect, useRef, type RefObject } from 'react';

import { HEADER_VAR } from '~/utils/layout';

import { SITE_NAV } from './links';
import { MobileMenu } from './MobileMenu';
import { PlatformBar } from './PlatformBar';
import { SiteLink } from './SiteLink';
import { SiteSearch } from './SiteSearch';
import { TourTicker } from './TourTicker';
import { Wordmark } from './Wordmark';

import classes from './SiteHeader.module.css';
import utils from '~/styles/utils.module.css';

const usePublishHeight = (ref: RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty(HEADER_VAR, `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty(HEADER_VAR);
    };
  }, [ref]);
};

export const SiteHeader = memo(() => {
  const ref = useRef<HTMLElement>(null);
  usePublishHeight(ref);
  return (
    <>
      <PlatformBar />
      <header ref={ref} className={clsx(utils.onBrand, classes.header)}>
        <div className={clsx(utils.container, classes.row)}>
          <Wordmark className={classes.wordmark} />
          <nav aria-label="Main" className={classes.nav}>
            {SITE_NAV.map((it) => (
              <SiteLink key={it.label} item={it} className={classes.link} />
            ))}
          </nav>
          <div className={classes.actions}>
            <SiteSearch />
            <MobileMenu />
          </div>
        </div>
      </header>
      <TourTicker />
    </>
  );
});
