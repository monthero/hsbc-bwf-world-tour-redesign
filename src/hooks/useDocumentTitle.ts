import { useEffect } from 'react'

import { BWF_SITE, CURRENT_SITE } from '~/components/layout/links'

type TitlePart = string | undefined

type TitleSite = 'bwf' | { season?: number }

const siteName = (site: TitleSite) => {
  if (site === 'bwf') return BWF_SITE
  return site.season ? `${CURRENT_SITE} ${site.season}` : CURRENT_SITE
}

export const useDocumentTitle = (parts: TitlePart | readonly TitlePart[], site: TitleSite = {}) => {
  const title = [parts, siteName(site)].flat().filter(Boolean).join(' · ')
  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])
}
