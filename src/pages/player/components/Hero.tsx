import { memo } from 'react'

import { CountryLabel } from '~/components/country'
import { Partner, PlayerAvatar, PlayerName, RankChange, SeedTag } from '~/components/player'
import { useIsMobile } from '~/hooks/useIsMobile'
import { usePlayerPhoto } from '~/hooks/usePlayers'
import type { EventCode, Focus, Player, RankView } from '~/types'
import { formatRank, plural } from '~/utils/format'
import { heroVars, playerHeroUrl } from '~/utils/images'

import type { CareerHigh } from '../types'

import classes from './Hero.module.css'

interface HeroProps {
  player: Player
  hero: string | null | undefined
  seed: number | null
  prize: string
  ranks: RankView[]
  highs: ReadonlyMap<EventCode, CareerHigh>
  focus?: Focus | null
}

const AVATAR_CROP = 240

export const Hero = memo<HeroProps>(({ player, hero, seed, prize, ranks, highs, focus }) => {
  const isMobile = useIsMobile()
  const hasPhoto = !!usePlayerPhoto(player.id).src
  const heroStyle = hero ? heroVars(playerHeroUrl(player.id, hero, isMobile, !!focus), focus) : undefined
  const cards = ranks.filter((k) => k.rank).slice(0, 3)
  return (
    <div className={classes.hero} style={heroStyle} data-image={hero ? true : undefined}>
      <div className={classes.content}>
        <div className={classes.identity}>
          <span className={classes.meta}>
            {player.cc && <CountryLabel cc={player.cc} flagSize="lg" />}
            <SeedTag seed={seed} variant="pill" />
            {prize && (
              <span className={classes.prize}>
                <b>{prize}</b> career prize money
              </span>
            )}
          </span>
          <div className={classes.title}>
            {hasPhoto && (
              <PlayerAvatar player={player} size={isMobile ? 76 : 112} crop={AVATAR_CROP} className={classes.avatar} />
            )}
            <h1 className={classes.name}>
              <PlayerName
                player={player}
                link={false}
                layout="stacked"
                firstClassName={classes.first}
                lastClassName={classes.last}
              />
            </h1>
          </div>
        </div>
        {cards.length > 0 && (
          <div className={classes.cards}>
            {cards.map((k) => (
              <RankTile key={k.ev} rank={k} high={highs.get(k.ev)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

const RankTile = memo<{ rank: RankView; high: CareerHigh | undefined }>(({ rank: k, high }) => {
  return (
    <div className={classes.card}>
      <span className={classes.cardLabel}>World rank · {k.ev}</span>
      <span className={classes.cardRank}>
        <span className={classes.cardNum}>{formatRank(k.rank)}</span>
        <RankChange value={k.change} className={classes.cardChange} />
      </span>
      <span className={classes.cardSub}>Race to Finals {formatRank(k.race?.rank)}</span>
      {high && (
        <span className={classes.cardHigh}>
          <span className={classes.cardSub}>
            Career high <b>{formatRank(high.rank)}</b>
            {high.weeks ? ` · ${plural(high.weeks, 'week')}` : ''}
          </span>
          {high.partner && <Partner player={high.partner} className={classes.cardPartner} />}
        </span>
      )}
    </div>
  )
})
