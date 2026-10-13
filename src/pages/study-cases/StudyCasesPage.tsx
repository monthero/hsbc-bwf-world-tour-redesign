import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { FC } from 'react';

import { EmptyState, IconNext, PageHeader } from '~/components/ui';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';

import { STUDY_CASES } from './cases';

import classes from './StudyCasesPage.module.css';
import utils from '~/styles/utils.module.css';

export const StudyCasesPage: FC = () => {
  useDocumentTitle('Study cases', 'bwf');
  return (
    <div className={classes.page}>
      <PageHeader
        kicker="Dev only"
        title="Study cases"
        meta="Design explorations rendered with fixtures. Never shipped."
      />
      <div className={clsx(utils.container, classes.list)}>
        {!STUDY_CASES.length && <EmptyState className={classes.empty}>No study cases right now.</EmptyState>}
        {STUDY_CASES.map((c) => (
          <Link key={c.title} to={c.to} className={clsx(utils.card, utils.link, classes.item)} data-interactive>
            <span className={classes.text}>
              <span className={classes.title}>{c.title}</span>
              <span className={classes.summary}>{c.summary}</span>
            </span>
            <IconNext size={18} />
          </Link>
        ))}
      </div>
    </div>
  );
};
