import '@mantine/dates/styles.layer.css';
import { DatesProvider } from '@mantine/dates';
import { clsx } from 'clsx';
import type { FC } from 'react';

import { useDocumentMeta } from '~/hooks/useDocumentMeta';

import { PlayersTab } from './components/PlayersTab';

import classes from './AdminPage.module.css';
import utils from '~/styles/utils.module.css';

const ADMIN_META = { title: 'Admin' };

const DATES_SETTINGS = { firstDayOfWeek: 1, consistentWeeks: true } as const;

const Console: FC = () => (
  <div className={classes.page}>
    <header className={clsx(utils.container, classes.header)}>
      <span className={classes.kicker}>Local overrides</span>
      <h1 className={classes.title}>Admin</h1>
      <p className={classes.meta}>Saves write data/overrides.json and re-export public/data.</p>
    </header>
    <PlayersTab />
  </div>
);

export const AdminPage: FC = () => {
  useDocumentMeta(ADMIN_META);
  return (
    <DatesProvider settings={DATES_SETTINGS}>
      <Console />
    </DatesProvider>
  );
};
