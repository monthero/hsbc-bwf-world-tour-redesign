import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconStarFilled } from '~/components/ui';
import { useIsPlayerFavorite } from '~/stores/favorites';

import classes from './FollowedMark.module.css';

export const FollowedMark = memo<{ id: string; className?: string }>(({ id, className }) => {
  const on = useIsPlayerFavorite(id);
  const { t } = useLingui();
  return on ? (
    <IconStarFilled
      className={clsx(classes.mark, className)}
      aria-label={t({ message: 'Following', comment: 'Star mark beside a player the visitor follows' })}
    />
  ) : null;
});
