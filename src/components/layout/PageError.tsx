import { useLingui } from '@lingui/react';
import { useRouter } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, type FC } from 'react';

import { RetryState } from '~/components/ui';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { ERROR_DESCRIPTION, ERROR_META } from '~/utils/meta';

import classes from './PageError.module.css';
import utils from '~/styles/utils.module.css';

export const PageError: FC = () => {
  useDocumentMeta(ERROR_META);
  const { _ } = useLingui();
  const router = useRouter();
  const retry = useCallback(() => void router.invalidate(), [router]);
  return (
    <section className={clsx(utils.container, classes.root)}>
      <RetryState message={_(ERROR_DESCRIPTION)} onRetry={retry} />
    </section>
  );
};
