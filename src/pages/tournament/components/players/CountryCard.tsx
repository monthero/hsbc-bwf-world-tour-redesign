import { Collapse } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useState } from 'react';

import { Flag } from '~/components/country';
import { FollowButton } from '~/components/follow';
import { IconExpand } from '~/components/ui';

import type { CountryGroup } from './entries';
import { EntryRow } from './EntryRow';

import classes from './Players.module.css';
import utils from '~/styles/utils.module.css';

export const CountryCard = memo<{
  country: CountryGroup;
  accordion: boolean;
  forceOpen: boolean;
  onOpen: (id: string) => void;
}>(({ country, accordion, forceOpen, onOpen }) => {
  const { cc, name, entries } = country;
  const [expanded, setExpanded] = useState(false);
  const open = !accordion || forceOpen || expanded;

  const rows = entries.map((e) => <EntryRow key={e.key} entry={e} onOpen={onOpen} />);

  return (
    <div className={clsx(utils.card, classes.card)}>
      <div className={classes.cardHead}>
        <button
          type="button"
          className={classes.cardToggle}
          aria-expanded={open}
          disabled={!accordion}
          onClick={() => setExpanded((v) => !v)}
        >
          <Flag cc={cc} size="lg" tip={false} className={classes.cardFlag} />
          <span className={classes.cardName}>{name}</span>
          <span className={classes.cardCount}>{entries.length}</span>
          {accordion && <IconExpand size={16} className={classes.chevron} data-open={open || undefined} />}
        </button>
        <FollowButton kind="country" id={cc} name={name} />
      </div>
      {accordion ? <Collapse expanded={open}>{rows}</Collapse> : rows}
    </div>
  );
});
