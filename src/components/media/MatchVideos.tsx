import type { FC } from 'react'

import { useMatchMedia } from '~/hooks/useTournamentMedia'
import type { Match, Tournament } from '~/types'

import { VideoCard } from './VideoCard'

import classes from './MatchVideos.module.css'

export const MatchVideos: FC<{ match: Match; tournament: Tournament }> = ({ match, tournament }) => {
  const media = useMatchMedia(tournament, match)
  if (!media?.full && !media?.highlights) return null
  return (
    <section className={classes.root}>
      <h3 className={classes.title}>Watch on YouTube</h3>
      <div className={classes.grid}>
        {media.highlights && <VideoCard item={media.highlights} label="Highlights" />}
        {media.full && <VideoCard item={media.full} label="Full match" />}
      </div>
    </section>
  )
}
