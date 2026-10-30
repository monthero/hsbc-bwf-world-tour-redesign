import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { VisuallyHidden } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useMemo, type FC } from 'react';

import type { ImageCredit } from '~/api/schemas';
import { PlayerName } from '~/components/player';
import { IconExternal, PageHeader } from '~/components/ui';
import { useDocumentMeta } from '~/hooks/useDocumentMeta';
import { useImageCredits } from '~/hooks/usePlayers';
import { localAsset } from '~/utils/images';
import { CREDITS_PAGE_META } from '~/utils/meta';
import { toPlayer } from '~/utils/names';

import classes from './CreditsPage.module.css';
import utils from '~/styles/utils.module.css';

const KIND_LABELS = {
  photo: msg({
    message: 'Profile photo',
    comment: 'Credits table: this credit is for the player’s round profile photo',
  }),
  hero: msg({
    message: 'Banner photo',
    comment: 'Credits table: this credit is for the wide photo at the top of the player’s profile',
  }),
};

const CreditRow = memo<{ credit: ImageCredit; source: string }>(({ credit: c, source }) => {
  const { i18n } = useLingui();
  const player = useMemo(() => toPlayer(c.name, c.cc, c.id), [c.name, c.cc, c.id]);
  const kind = i18n._(KIND_LABELS[c.kind]);
  return (
    <tr>
      <td className={classes.thumbCell}>
        <img src={localAsset(c.image)} alt={kind} loading="lazy" className={classes.thumb} />
      </td>
      <td className={classes.who}>
        <PlayerName player={player} />
        <span className={classes.kind}>{kind}</span>
      </td>
      <td className={classes.author}>{c.author}</td>
      <td className={classes.license}>
        {c.licenseUrl ? (
          <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className={utils.link}>
            {c.license}
          </a>
        ) : (
          c.license
        )}
      </td>
      <td className={classes.source}>
        <a href={c.page} target="_blank" rel="noopener noreferrer" className={utils.link} aria-label={source}>
          <IconExternal size={14} />
        </a>
      </td>
    </tr>
  );
});

export const CreditsPage: FC = () => {
  useDocumentMeta(CREDITS_PAGE_META);
  const { t, i18n } = useLingui();
  const { data } = useImageCredits();
  const source = t({
    message: 'Source',
    comment: 'Credits table column: link to the original photo on Wikimedia Commons',
  });
  return (
    <>
      <PageHeader
        kicker={t`About this site`}
        title={i18n._(CREDITS_PAGE_META.title)}
        meta={i18n._(CREDITS_PAGE_META.description)}
      />
      <div className={clsx(utils.container, classes.wrap)}>
        <table className={classes.table}>
          <thead>
            <tr>
              <th scope="col">
                <VisuallyHidden>
                  {t({ message: 'Image', comment: 'Credits table column: thumbnail of the credited photo' })}
                </VisuallyHidden>
              </th>
              <th scope="col">
                <Trans comment="Rankings table column: the player">Player</Trans>
              </th>
              <th scope="col">
                <Trans comment="Credits table column: the person or organization who took the photo">Photo by</Trans>
              </th>
              <th scope="col">
                <Trans comment="Credits table column: the license the photo is shared under, e.g. CC BY 4.0">
                  License
                </Trans>
              </th>
              <th scope="col">{source}</th>
            </tr>
          </thead>
          <tbody>
            {data?.credits.map((c) => (
              <CreditRow key={`${c.id}-${c.page}`} credit={c} source={source} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
