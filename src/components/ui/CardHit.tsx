import type { FC } from 'react';

import utils from '~/styles/utils.module.css';

export const CardHit: FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  return <button type="button" className={utils.hit} aria-label={label} onClick={onClick} />;
};
