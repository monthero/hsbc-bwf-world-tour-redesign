import { clsx } from 'clsx'
import { memo } from 'react'

import type { NewsStory } from '~/utils/news'

import { NewsImage } from './NewsImage'
import { NewsMeta } from './NewsMeta'
import { NewsTitle } from './NewsTitle'
import { TournamentChip } from './TournamentChip'

import classes from './NewsCard.module.css'
import utils from '~/styles/utils.module.css'

export type NewsCardVariant = 'card' | 'row' | 'list'

const CARD_WIDTHS = [400, 640, 800] as const
const THUMB_WIDTHS = [160, 240, 336] as const
const CARD_SIZES = '(max-width: 48em) 100vw, 420px'
const THUMB_SIZES = '112px'

export const NewsCard = memo<{
  story: NewsStory
  variant?: NewsCardVariant
  className?: string
}>(({ story, variant = 'card', className }) => {
  const card = variant === 'card'
  return (
    <article
      className={clsx(card && utils.card, classes.card, className)}
      data-variant={variant}
      data-interactive={card || undefined}
      data-news-hover={card ? 'drift' : 'shade'}
    >
      <NewsImage
        image={story.item.image}
        ratio={card ? 'wide' : 'card'}
        widths={card ? CARD_WIDTHS : THUMB_WIDTHS}
        sizes={card ? CARD_SIZES : THUMB_SIZES}
        className={classes.media}
      >
        {card && story.tournament && (
          <TournamentChip tournament={story.tournament} variant="glass" className={classes.tag} />
        )}
      </NewsImage>
      <div className={classes.body}>
        <NewsTitle story={story} as="h3" className={classes.title} />
        <NewsMeta story={story} chip={!card} />
      </div>
    </article>
  )
})
