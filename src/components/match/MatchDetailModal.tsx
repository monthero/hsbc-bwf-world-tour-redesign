import { Modal } from '@mantine/core';
import { clsx } from 'clsx';
import { useState, type FC } from 'react';

import { TournamentRanks } from '~/components/player/TournamentRanks';
import { BottomSheet } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Match, Tournament } from '~/types';

import { MatchDetail } from './detail';

import classes from './MatchDetailModal.module.css';
import utils from '~/styles/utils.module.css';

interface MatchDetailModalProps {
  match: Match | null;
  tournament: Tournament;
  onClose: () => void;
}

const MODAL_CLASSES = { content: clsx(utils.popover, classes.modal), body: classes.body };

export const MatchDetailModal: FC<MatchDetailModalProps> = ({ match, tournament, onClose }) => {
  const mobile = useIsMobile();
  const [shown, setShown] = useState(match);
  if (match && match !== shown) setShown(match);
  const opened = !!match;
  const body = shown && (
    <TournamentRanks tournament={tournament}>
      <MatchDetail key={shown.id} match={shown} tournament={tournament} onClose={onClose} />
    </TournamentRanks>
  );

  if (mobile)
    return (
      <BottomSheet opened={opened} onClose={onClose} maxHeight="88dvh" bodyClassName={classes.body}>
        {body}
      </BottomSheet>
    );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={780}
      radius={20}
      padding={0}
      withCloseButton={false}
      classNames={MODAL_CLASSES}
    >
      {body}
    </Modal>
  );
};
