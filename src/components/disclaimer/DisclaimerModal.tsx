import { Trans } from '@lingui/react/macro';
import { Button, Modal } from '@mantine/core';
import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';

import { IconInfo } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useDisclaimer, useDisclaimerAcknowledged } from '~/stores/disclaimer';

import classes from './DisclaimerModal.module.css';
import utils from '~/styles/utils.module.css';

const BWF_URL = 'https://bwfbadminton.com';
const WORLD_TOUR_URL = 'https://bwfworldtour.bwfbadminton.com';

const MODAL_CLASSES = {
  inner: classes.inner,
  content: clsx(utils.popover, classes.content),
  header: classes.header,
  title: classes.title,
  body: classes.body,
};
const DESKTOP_TRANSITION = { transition: 'pop', duration: 200 } as const;
const MOBILE_TRANSITION = { transition: 'slide-up', duration: 260 } as const;

const noop = () => {};

const ExternalLink: FC<{ href: string; children: ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className={classes.link}>
    {children}
  </a>
);

const TITLE = (
  <>
    <span className={classes.badge}>
      <IconInfo size={18} />
    </span>
    <Trans comment="Title of the one-time disclaimer shown on the first visit">A quick note before you start</Trans>
  </>
);

const MESSAGE = (
  <>
    <p className={classes.text}>
      <Trans>
        This website is an unofficial redesign concept for the{' '}
        <ExternalLink href={WORLD_TOUR_URL}>HSBC BWF World Tour</ExternalLink> section of the BWF website. It is not
        affiliated with, endorsed by or operated by the Badminton World Federation (BWF) or HSBC.
      </Trans>
    </p>
    <p className={classes.text}>
      <Trans>
        All tournament data, results, rankings, images, logos and player information belong to BWF, the players and
        their respective rights holders. Videos link to BWF’s official YouTube channel.
      </Trans>
    </p>
    <p className={clsx(utils.inset, classes.note)}>
      <Trans>
        Data may be incomplete, delayed or inaccurate. For official information, please visit{' '}
        <ExternalLink href={BWF_URL}>bwfbadminton.com</ExternalLink>.
      </Trans>
    </p>
  </>
);

export const DisclaimerModal: FC = () => {
  const acknowledged = useDisclaimerAcknowledged();
  const acknowledge = useDisclaimer((s) => s.acknowledge);
  const mobile = useIsMobile();

  return (
    <Modal
      opened={!acknowledged}
      onClose={noop}
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      size={520}
      padding={0}
      title={TITLE}
      transitionProps={mobile ? MOBILE_TRANSITION : DESKTOP_TRANSITION}
      classNames={MODAL_CLASSES}
    >
      {MESSAGE}
      <Button data-autofocus size="md" radius="xl" className={classes.cta} onClick={acknowledge}>
        <Trans comment="Button that dismisses the first-visit disclaimer">I understand</Trans>
      </Button>
    </Modal>
  );
};
