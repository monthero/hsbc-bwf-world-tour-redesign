import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Collapse } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { clsx } from 'clsx';
import { memo } from 'react';

import { Flag } from '~/components/country';
import { FollowButton } from '~/components/follow';
import { IconExpand, IconPartners } from '~/components/ui';

import type { CountryGroup } from './entries';
import { EntryRow } from './EntryRow';

import classes from './Players.module.css';
import utils from '~/styles/utils.module.css';

const INTERNATIONAL_PAIRS = msg({
  message: 'International pairs',
  comment: 'Players tab card title: doubles pairs whose two players represent different countries',
});

export const CountryCard = memo<{
  country: CountryGroup;
  accordion: boolean;
  forceOpen: boolean;
  onOpen: (id: string) => void;
}>(({ country, accordion, forceOpen, onOpen }) => {
  const { i18n } = useLingui();
  const { cc, entries } = country;
  const name = cc === null ? i18n._(INTERNATIONAL_PAIRS) : country.name;
  const [expanded, { toggle }] = useDisclosure(false);
  const open = !accordion || forceOpen || expanded;

  const rows = entries.map((e) => <EntryRow key={e.key} entry={e} flags={cc === null} onOpen={onOpen} />);

  return (
    <div className={clsx(utils.card, classes.card)}>
      <div className={classes.cardHead}>
        <button
          type="button"
          className={classes.cardToggle}
          aria-expanded={open}
          disabled={!accordion}
          onClick={toggle}
        >
          {cc === null ? (
            <IconPartners size={22} className={classes.cardIcon} aria-hidden />
          ) : (
            <Flag cc={cc} size="lg" tip={false} className={classes.cardFlag} />
          )}
          <span className={classes.cardName}>{name}</span>
          <span className={classes.cardCount}>{entries.length}</span>
          {accordion && <IconExpand size={16} className={classes.chevron} data-open={open || undefined} />}
        </button>
        {cc !== null && <FollowButton kind="country" id={cc} name={name} />}
      </div>
      {accordion ? <Collapse expanded={open}>{rows}</Collapse> : rows}
    </div>
  );
});
