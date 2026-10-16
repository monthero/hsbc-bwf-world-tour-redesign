import { Trans, useLingui } from '@lingui/react/macro';
import { Alert } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { IconTranslate } from '~/components/ui';
import { SOURCE_LOCALE } from '~/i18n/locales';
import { useLocaleStore } from '~/stores/locale';

import classes from './EnglishOnlyNotice.module.css';

const ICON = <IconTranslate />;

export const EnglishOnlyNotice = memo<{ className?: string }>(({ className }) => {
  const { i18n, t } = useLingui();
  const dismissed = useLocaleStore((s) => s.newsNoticeDismissed);
  const dismiss = useLocaleStore((s) => s.dismissNewsNotice);
  if (dismissed || i18n.locale === SOURCE_LOCALE) return null;
  return (
    <Alert
      icon={ICON}
      color="blue"
      radius="lg"
      withCloseButton
      closeButtonLabel={t({ message: 'Dismiss', comment: 'Close button on a notice banner' })}
      onClose={dismiss}
      title={
        <Trans comment="Notice title on the news pages when the site language isn’t English">
          News stays in English
        </Trans>
      }
      className={clsx(classes.notice, className)}
    >
      <Trans comment="Notice on the news pages when the site language isn’t English: BWF only publishes its articles in English, so they aren’t translated">
        BWF publishes its news in English only, so articles and headlines are shown in English.
      </Trans>
    </Alert>
  );
});
