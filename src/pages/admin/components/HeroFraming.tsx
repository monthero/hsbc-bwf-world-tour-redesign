import { memo, useMemo, type FC, type KeyboardEvent, type PointerEvent } from 'react';

import { Hero } from '~/pages/player/components/Hero';
import type { CareerHigh } from '~/pages/player/types';
import { careerOf } from '~/pages/player/utils';
import type { EventCode, Focus, Player, RankView } from '~/types';
import { buildBio, DEFAULT_BIO_UNITS } from '~/utils/players';

import { arrowNudge, clampPercent, useDrag, useFramingEditor, type FramingEditorProps } from './framing';
import { FramingControls } from './FramingControls';

import classes from './HeroFraming.module.css';

const NO_RANKS: RankView[] = [];
const NO_HIGHS: ReadonlyMap<EventCode, CareerHigh> = new Map();
const CENTER: Focus = { x: 50, y: 50 };
const EMPTY_BIO = buildBio(undefined, DEFAULT_BIO_UNITS);
const NO_CAREER = careerOf([]);

const pointAt = (e: PointerEvent<HTMLElement>): Focus => {
  const r = e.currentTarget.getBoundingClientRect();
  return {
    x: clampPercent(((e.clientX - r.left) / r.width) * 100),
    y: clampPercent(((e.clientY - r.top) / r.height) * 100),
  };
};

const focusLabel = (focus: Focus | null) => (focus ? `Focus ${focus.x}% · ${focus.y}%` : 'Default framing');

const HeroPreview = memo<{ player: Player; hero: string; prize: string; focus: Focus | null; mobile: boolean }>(
  ({ player, hero, prize, focus, mobile }) => {
    const bio = useMemo(() => ({ ...EMPTY_BIO, prize }), [prize]);
    return (
      <Hero
        player={player}
        hero={hero}
        focus={focus}
        bio={bio}
        ranks={NO_RANKS}
        highs={NO_HIGHS}
        career={NO_CAREER}
        mobile={mobile}
        ready
      />
    );
  },
);

const FocusPad: FC<{
  image: string;
  focus: Focus | null;
  onDrag: (focus: Focus | null) => void;
  onCommit: (focus: Focus) => void;
}> = ({ image, focus, onDrag, onCommit }) => {
  const drag = useDrag(
    (e) => onDrag(pointAt(e)),
    (_, e) => onDrag(pointAt(e)),
    (_, e) => {
      onDrag(null);
      onCommit(pointAt(e));
    },
  );
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const nudge = arrowNudge(e);
    if (!nudge) return;
    const from = focus ?? CENTER;
    onCommit({ x: clampPercent(from.x + nudge.dx), y: clampPercent(from.y + nudge.dy) });
  };
  return (
    <button
      type="button"
      className={classes.pad}
      aria-label={`Hero focus point: ${focusLabel(focus)}. Click or drag, or use the arrow keys`}
      {...drag}
      onKeyDown={onKey}
    >
      <img src={image} alt="" draggable={false} referrerPolicy="no-referrer" className={classes.thumb} />
      {focus && <span className={classes.cross} style={{ left: `${focus.x}%`, top: `${focus.y}%` }} />}
    </button>
  );
};

export const HeroFraming = memo<
  FramingEditorProps<Focus> & {
    player: Player;
    hero: string;
    image: string;
    prize?: string;
  }
>(({ player, hero, image, prize = '', ...editor }) => {
  const { shown, setDrag, onCommit, controls } = useFramingEditor(editor);
  return (
    <div className={classes.framing}>
      <div className={classes.top}>
        <FocusPad image={image} focus={shown} onDrag={setDrag} onCommit={onCommit} />
        <div className={classes.phone}>
          <HeroPreview player={player} hero={hero} prize={prize} focus={shown} mobile />
        </div>
        <FramingControls title="Hero framing" readout={focusLabel(shown)} {...controls} />
      </div>
      <div className={classes.desktop}>
        <HeroPreview player={player} hero={hero} prize={prize} focus={shown} mobile={false} />
      </div>
    </div>
  );
});
